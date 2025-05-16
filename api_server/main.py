from http.server import HTTPServer
from time import sleep
from socketserver import TCPServer
from json import load
import json
import psycopg2
from http.server import SimpleHTTPRequestHandler as HTTP_handler
from json import loads, JSONDecodeError, dumps
import hashlib
"""

block of api functions

"""

def new_user(user_name, user_password):
    """
    Создает нового пользователя в базе данных.
    :param user_name: Имя пользователя.
    :param user_password: Пароль пользователя.
    :return: Сообщение об успешном создании пользователя.
    """
    global db_connection
    try:
        # Проверяем существование пользователя
        cursor = db_connection.cursor()
        cursor.execute("SELECT id FROM users WHERE name = %s", (user_name,))
        if cursor.fetchone():
            raise ValueError("Пользователь с таким именем уже существует")
        # Определяем, будет ли пользователь администратором
        is_admin = False
        # Открываем курсор для выполнения запроса
        cursor = db_connection.cursor()
        # SQL-запрос для добавления нового пользователя
        insert_user_query = """
        INSERT INTO users (name, passwd, is_admin)
        VALUES (%s, %s, %s)
        RETURNING id;
        """
        cursor.execute(insert_user_query, (user_name, user_password, is_admin))
        # Получаем ID нового пользователя
        user_id = cursor.fetchone()[0]
        # Фиксируем изменения в базе данных
        db_connection.commit()
        print(f"Пользователь с ID {user_id} успешно создан. Администратор: {is_admin}")
        # Генерация идентификатора и добавление в таблицу identifiers
        user_identifier = hashlib.sha256(f"{user_name}{user_password}".encode()).hexdigest()
        query_identifier = """
        INSERT INTO identifiers (user_id, identifier)
        VALUES (%s, %s)
        """
        cursor.execute(query_identifier, (user_id, user_identifier))
        db_connection.commit()
        return {"user": user_identifier}
    except Exception as e:
        print(f"Ошибка при создании пользователя: {e}")
        db_connection.rollback()
        raise e
    finally:
        cursor.close()


def new_admin(admin_key, user_name):
    try:
        cursor = db_connection.cursor()
        # Проверяем существование пользователя
        cursor.execute("SELECT user_id FROM identifiers WHERE identifier = %s;", (admin_key,))
        result = cursor.fetchone()
        if not result:
            raise ValueError("wrong x-key")
        user_id = result[0]

        # Проверяем, является ли отправитель администратором
        query_requester = "SELECT is_admin FROM users WHERE id = %s;"
        cursor.execute(query_requester, (user_id,))
        requester_admin_status = cursor.fetchone()
        if not requester_admin_status or not requester_admin_status[0]:
            raise ValueError("Недостаточно прав")

        # Найти целевого пользователя
        query_target = "SELECT id FROM users WHERE name = %s"
        cursor.execute(query_target, (user_name,))
        target_user = cursor.fetchone()
        if not target_user:
            raise ValueError("Целевой пользователь не найден")
        target_user_id = target_user[0]

        # Обновить права целевого пользователя
        query_promote = """
        UPDATE users
        SET is_admin = TRUE
        WHERE id = %s
        """
        cursor.execute(query_promote, (target_user_id,))
        db_connection.commit()

        return {"message": f"Пользователь '{user_name}' успешно повышен до администратора"}
    except Exception as e:
        print(f"Ошибка при повышении прав: {e}")
        db_connection.rollback()
        raise ValueError("Не удалось повысить права пользователя")
    finally:
        cursor.close()


def new_recipe(user_key, recipe_name, description, ingredients, way_to_cook, image=None):
    global db_connection
    if not recipe_name or not description or not ingredients or not way_to_cook:
        raise ValueError("Название рецепта, описание, способ приготовления и список ингредиентов не могут быть пустыми")
    
    try:
        cursor = db_connection.cursor()

        # Найти пользователя по ключу
        query_user = "SELECT user_id FROM identifiers WHERE identifier = %s"
        cursor.execute(query_user, (user_key,))
        user_id = cursor.fetchone()
        if not user_id:
            raise ValueError("Пользователь не найден")
        user_id = user_id[0]

        print(f"[DEBUG]: user_id = {user_id}")

        # Проверяем, является ли пользователь администратором
        admin_check_query = """
        SELECT is_admin FROM users WHERE id = %s;
        """
        cursor.execute(admin_check_query, (user_id,))
        result = cursor.fetchone()
        if not result or not result[0]:
            raise ValueError("Недостаточно прав")

        print(f"[DEBUG]: Проверка прав доступа успешно пройдена")
        print(f"[DEBUG]: recipe_name = {recipe_name}, description = {description}, way_to_cook = {way_to_cook}")

        # SQL-запрос для вставки нового рецепта с изображением (если оно передано)
        if image:
            insert_recipe_query = """
            INSERT INTO recipes (name, description, way_to_cook, image)
            VALUES (%s, %s, %s, %s)
            RETURNING id;
            """
            cursor.execute(insert_recipe_query, (recipe_name, description, way_to_cook, image))
        else:
            insert_recipe_query = """
            INSERT INTO recipes (name, description, way_to_cook)
            VALUES (%s, %s, %s)
            RETURNING id;
            """
            cursor.execute(insert_recipe_query, (recipe_name, description, way_to_cook))
        
        recipe_id = cursor.fetchone()[0]

        print(f"[DEBUG]: adding recipe with name \"{recipe_name}\", description \"{description}\" and way to cook \"{way_to_cook}\"")

        # Обработка ингредиентов
        for ingredient in ingredients:
            ingredient_name = ingredient.get("name", "").strip()
            quantity = ingredient.get("quantity", "").strip()
            unit = ingredient.get("unit", "").strip()

            # Проверяем, что параметры не пустые
            if not ingredient_name:
                raise ValueError("Название ингредиента не может быть пустым")
            if not quantity:
                raise ValueError(f"Количество ингредиента '{ingredient_name}' не может быть пустым")
            if not unit:
                raise ValueError(f"Единица измерения ингредиента '{ingredient_name}' не может быть пустой")

            print(f"[DEBUG]: ingredient_name = \"{ingredient_name}\" quantity = \"{quantity}\" unit = \"{unit}\"")

            # Проверяем существование ингредиента в базе данных
            select_ingredient_query = "SELECT id FROM ingredients WHERE name = %s"
            cursor.execute(select_ingredient_query, (ingredient_name,))
            ingredient_id = cursor.fetchone()

            print(f"[DEBUG]: ingredient_id = \"{ingredient_id}\"")

            # Если ингредиента нет, добавляем его
            if not ingredient_id:
                insert_ingredient_query = "INSERT INTO ingredients (name) VALUES (%s) RETURNING id"
                cursor.execute(insert_ingredient_query, (ingredient_name,))
                ingredient_id = cursor.fetchone()[0]
            else:
                ingredient_id = ingredient_id[0]

            # Вставляем ингредиент для рецепта
            insert_recipe_ingredient_query = """
            INSERT INTO ingredients_for_recipes (recipe_id, ingredient_id, quantity, unit)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(insert_recipe_ingredient_query, (recipe_id, ingredient_id, quantity, unit))

        # Фиксируем изменения
        db_connection.commit()

        print(f"[DEBUG]: Recipe with ID {recipe_id} successfully added")

        return {"id": recipe_id, "name": recipe_name}

    except Exception as e:
        print(f"Ошибка при добавлении рецепта: {e}")
        db_connection.rollback()
        raise e

    finally:
        cursor.close()




def get_ingredients():
    """
    Получает список всех ингредиентов из базы данных.
    :return: Список словарей с информацией об ингредиентах (id и name).
    """
    global db_connection
    try:
        # Открываем курсор для выполнения запроса
        cursor = db_connection.cursor()
        # SQL-запрос для получения ингредиентов
        select_query = """
        SELECT id, name FROM ingredients;
        """
        cursor.execute(select_query)
        # Извлекаем результаты запроса
        ingredients = cursor.fetchall()
        # Закрываем курсор
        cursor.close()
        # Преобразуем результаты в список словарей
        ingredient_list = [
            {"id": ingredient[0], "name": ingredient[1]}
            for ingredient in ingredients
        ]
        print(f"Получено {len(ingredient_list)} ингредиентов из базы данных.")
        # Возвращаем список ингредиентов
        return ingredient_list
    except Exception as e:
        print(f"Ошибка при получении списка ингредиентов: {e}")
        raise ValueError("Не удалось получить список ингредиентов")

def get_recipe():
    """
    Получает список всех рецептов из базы данных.
    :return: Список словарей с информацией о рецептах (id, name, description, image).
    """
    global db_connection
    try:
        # Открываем курсор для выполнения запроса
        cursor = db_connection.cursor()
        # SQL-запрос для получения рецептов
        select_recipes_query = """
        SELECT id, name, description, image FROM recipes;
        """
        cursor.execute(select_recipes_query)
        recipes = cursor.fetchall()
        # Создаём список рецептов с нужной информацией
        recipe_list = [
            {"id": recipe[0], "name": recipe[1], "description": recipe[2], "image": recipe[3]}
            for recipe in recipes
        ]
        # Закрываем курсор
        cursor.close()
        print(f"Получено {len(recipe_list)} рецептов из базы данных.")
        # Возвращаем список рецептов
        return recipe_list
    except Exception as e:
        print(f"Ошибка при получении списка рецептов: {e}")
        raise ValueError("Не удалось получить список рецептов")





def get_recipe_by_filter(include_ingredients, exclude_ingredients):
    """
    Фильтрует рецепты по заданным критериям.
    :param include_ingredients: Список id ингредиентов, которые должны содержаться в рецепте.
    :param exclude_ingredients: Список id ингредиентов, которых не должно быть в рецепте.
    :return: Список словарей с информацией о рецептах (id, name, description).
    """
    global db_connection
    try:
        cursor = db_connection.cursor()
        # Условие для фильтрации рецептов по включаемым ингредиентам
        include_condition = " AND ".join(
            f"EXISTS (SELECT 1 FROM ingredients_for_recipes ir WHERE ir.recipe_id = r.id AND ir.ingredient_id = {ingr_id})"
            for ingr_id in include_ingredients
        ) if include_ingredients else "TRUE"
        # Условие для фильтрации рецептов по исключаемым ингредиентам
        exclude_condition = " AND ".join(
            f"NOT EXISTS (SELECT 1 FROM ingredients_for_recipes ir WHERE ir.recipe_id = r.id AND ir.ingredient_id = {ingr_id})"
            for ingr_id in exclude_ingredients
        ) if exclude_ingredients else "TRUE"
        # Основной запрос
        query = f"""
        SELECT r.id, r.name, r.description, image
        FROM recipes r
        WHERE {include_condition} AND {exclude_condition};
        """
        cursor.execute(query)
        recipes = cursor.fetchall()
        # Создаём список рецептов с нужной информацией
        result = [
            {"id": recipe[0], "name": recipe[1], "description": recipe[2], "image": recipe[3]}
            for recipe in recipes
        ]
        return result
    except Exception as e:
        print(f"Ошибка при фильтрации рецептов: {e}")
        raise ValueError("Не удалось выполнить фильтрацию рецептов")
    finally:
        cursor.close()



def get_favourite(user_key):
    """
    Получает список любимых рецептов пользователя.
    :param user_key: Идентификатор пользователя.
    :return: Список словарей с информацией о любимых рецептах (id, name, description, image).
    """
    global db_connection
    try:
        # Открываем курсор для выполнения запроса
        cursor = db_connection.cursor()
        # Найти пользователя по ключу
        query_user = "SELECT user_id FROM identifiers WHERE identifier = %s"
        cursor.execute(query_user, (user_key,))
        user_id = cursor.fetchone()
        if not user_id:
            raise ValueError("Пользователь не найден")
        user_id = user_id[0]
        # SQL-запрос для получения любимых рецептов
        select_favourites_query = """
        SELECT r.id, r.name, r.description, r.image
        FROM favorite f
        JOIN recipes r ON f.recipe_id = r.id
        WHERE f.user_id = %s;
        """
        cursor.execute(select_favourites_query, (user_id,))
        favourites = cursor.fetchall()
        # Формируем список любимых рецептов
        favourite_list = [
            {"id": recipe[0], "name": recipe[1], "description": recipe[2], "image": recipe[3]}
            for recipe in favourites
        ]
        print(f"Получено {len(favourite_list)} любимых рецептов пользователя с ID {user_id}.")
        return favourite_list
    except Exception as e:
        db_connection.rollback()
        print(f"Ошибка при получении любимых рецептов: {e}")
        raise ValueError("Не удалось получить любимые рецепты")
    finally:
        cursor.close()




def get_user_indent(username, password):
    """
    Аутентифицирует пользователя по имени и паролю.
    Возвращает хэшированный ключ, если аутентификация успешна.
    Выбрасывает исключение, если аутентификация не удалась.
    """
    cursor = db_connection.cursor()
    try:
        # Поиск идентификатора пользователя
        query = """
        SELECT u.id, i.identifier
        FROM users u
        JOIN identifiers i ON u.id = i.user_id
        WHERE u.name = %s AND u.passwd = %s
        """
        cursor.execute(query, (username, password))
        result = cursor.fetchone()
        if not result:
            raise ValueError("Неверные учетные данные")
        user_id, user_key = result
        print(f"Пользователь ID {user_id} успешно аутентифицирован.")
        return {"user_key": user_key}
    except Exception as e:
        print(f"Ошибка аутентификации пользователя: {e}")
        raise ValueError("Неверный логин или пароль")
    finally:
        cursor.close()

def delete_recipe(admin_key, recipe_id):
    """
    Удаляет рецепт по его ID.
    :param admin_key: Идентификатор администратора.
    :param recipe_id: ID рецепта, который нужно удалить.
    :return: Сообщение об успешном удалении.
    """
    try:
        cursor = db_connection.cursor()

        # Проверяем, что пользователь является администратором
        cursor.execute("SELECT user_id FROM identifiers WHERE identifier = %s;", (admin_key,))
        result = cursor.fetchone()
        if not result:
            raise ValueError("Неверный ключ администратора")
        user_id = result[0]

        # Проверяем права администратора
        cursor.execute("SELECT is_admin FROM users WHERE id = %s;", (user_id,))
        admin_status = cursor.fetchone()
        if not admin_status or not admin_status[0]:
            raise ValueError("Недостаточно прав")

        # Удаляем ингредиенты, связанные с рецептом
        delete_ingredients_query = "DELETE FROM ingredients_for_recipes WHERE recipe_id = %s;"
        cursor.execute(delete_ingredients_query, (recipe_id,))

        # Удаляем рецепты из избранного
        delete_favorite_query = "DELETE FROM favorite WHERE recipe_id = %s;"
        cursor.execute(delete_favorite_query, (recipe_id,))

        # Удаляем сам рецепт
        delete_recipe_query = "DELETE FROM recipes WHERE id = %s;"
        cursor.execute(delete_recipe_query, (recipe_id,))

        # Фиксируем изменения
        db_connection.commit()

        return {"message": f"Рецепт с ID {recipe_id} успешно удалён"}
    except Exception as e:
        print(f"Ошибка при удалении рецепта: {e}")
        db_connection.rollback()
        raise ValueError(f"Не удалось удалить рецепт. {e}")
    finally:
        cursor.close()


def remove_favorite(user_key, recipe_id):
    """
    Удаляет рецепт из списка любимых рецептов пользователя.
    :param user_key: Идентификатор пользователя.
    :param recipe_id: ID рецепта, который нужно удалить из избранного.
    :return: Сообщение об успешном удалении.
    """
    try:
        cursor = db_connection.cursor()

        # Проверяем существование пользователя
        query_user = "SELECT user_id FROM identifiers WHERE identifier = %s;"
        cursor.execute(query_user, (user_key,))
        user_id = cursor.fetchone()
        if not user_id:
            raise ValueError("Пользователь не найден")
        user_id = user_id[0]
        print(f"[DEBUG]: user_id = {user_id}\nrecipe_id = {recipe_id}")
        # Проверяем, существует ли рецепт в избранном у данного пользователя
        check_favorite_query = "SELECT id FROM favorite WHERE user_id = %s AND recipe_id = %s;"
        cursor.execute(check_favorite_query, (user_id, recipe_id))
        favorite_entry = cursor.fetchone()
        if not favorite_entry:
            raise ValueError("Рецепт не найден в списке избранного")

        # Удаляем рецепт из избранного
        delete_favorite_query = "DELETE FROM favorite WHERE user_id = %s AND recipe_id = %s;"
        cursor.execute(delete_favorite_query, (user_id, recipe_id))

        # Фиксируем изменения
        db_connection.commit()

        return {"message": f"Рецепт с ID {recipe_id} успешно удалён из избранного"}
    except Exception as e:
        print(f"Ошибка при удалении рецепта из избранного: {e}")
        db_connection.rollback()
        raise ValueError(f"Не удалось удалить рецепт из избранного, {e}")
    finally:
        cursor.close()


def add_recipe_to_favorites(user_identifier, recipe_id):
    """
    Добавляет рецепт в избранное для пользователя.
    :param user_identifier: Идентификатор пользователя.
    :param recipe_id: ID рецепта.
    :return: Сообщение об успешном добавлении.
    """
    global db_connection
    try:
        cursor = db_connection.cursor()
        # Проверяем существование пользователя по идентификатору
        query_user = "SELECT user_id FROM identifiers WHERE identifier = %s;"
        cursor.execute(query_user, (user_identifier,))
        user = cursor.fetchone()
        if not user:
            raise ValueError("Пользователь с указанным идентификатором не найден.")
        user_id = user[0]
        # Проверяем существование рецепта
        query_recipe = "SELECT id FROM recipes WHERE id = %s;"
        cursor.execute(query_recipe, (recipe_id,))
        recipe = cursor.fetchone()
        if not recipe:
            raise ValueError("Рецепт с указанным ID не найден.")
        # Проверяем, не добавлен ли рецепт уже в избранное
        query_favorite_exists = """
        SELECT id FROM favorite WHERE user_id = %s AND recipe_id = %s;
        """
        cursor.execute(query_favorite_exists, (user_id, recipe_id))
        if cursor.fetchone():
            raise ValueError("Рецепт уже находится в избранном.")
        # Добавляем рецепт в избранное
        query_add_favorite = """
        INSERT INTO favorite (user_id, recipe_id)
        VALUES (%s, %s);
        """
        cursor.execute(query_add_favorite, (user_id, recipe_id))
        db_connection.commit()
        return {"message": "Рецепт успешно добавлен в избранное."}
    except Exception as e:
        db_connection.rollback()
        print(f"Ошибка при добавлении рецепта в избранное: {e}")
        raise e
    finally:
        cursor.close()

def get_recipe_details(recipe_id):
    """
    Получает информацию о рецепте по его ID.
    :param recipe_id: ID рецепта.
    :return: Словарь с информацией о рецепте (name, description, ingredients, way_to_cook).
    """
    global db_connection
    try:
        # Открываем курсор для выполнения запроса
        cursor = db_connection.cursor()
        # SQL-запрос для получения информации о рецепте
        recipe_query = """
        SELECT name, description, way_to_cook
        FROM recipes
        WHERE id = %s;
        """
        cursor.execute(recipe_query, (recipe_id,))
        recipe = cursor.fetchone()
        if not recipe:
            raise ValueError("Рецепт с указанным ID не найден")

        name, description, way_to_cook = recipe
        # SQL-запрос для получения ингредиентов рецепта
        ingredients_query = """
        SELECT i.id, i.name, ir.quantity, ir.unit
        FROM ingredients_for_recipes ir
        JOIN ingredients i ON ir.ingredient_id = i.id
        WHERE ir.recipe_id = %s;
        """
        cursor.execute(ingredients_query, (recipe_id,))
        ingredients = cursor.fetchall()
        # Формируем список ингредиентов
        ingredient_list = [
            {"id": ingr[0], "name": ingr[1], "quantity": ingr[2], "unit": ingr[3]}
            for ingr in ingredients
        ]
        # Формируем результат
        recipe_details = {
            "id": recipe_id,
            "name": name,
            "description": description,
            "ingredients": ingredient_list,
            "way_to_cook": way_to_cook
        }
        print(f"Получены данные о рецепте с ID {recipe_id}.")
        return recipe_details
    except Exception as e:
        print(f"Ошибка при получении данных о рецепте: {e}")
        raise ValueError("Не удалось получить данные о рецепте")
    finally:
        cursor.close()

def get_status(user_key):
    """
    Проверяет статус пользователя (администратор или нет).
    :param user_key: Идентификатор пользователя из заголовка X-USER-KEY.
    :return: Словарь с информацией о статусе пользователя {"is_admin": bool}.
    """
    global db_connection
    try:
        print("[DEBUG] Функция get_user_status вызвана.")
        print(f"[DEBUG] Получен user_key: {user_key}")
        
        # Проверяем, передан ли ключ
        if not user_key:
            print("[ERROR] Ключ пользователя не предоставлен.")
            raise ValueError("Ключ пользователя не предоставлен")
        
        # Открываем курсор для выполнения запроса
        print("[DEBUG] Открываем курсор для выполнения запроса.")
        cursor = db_connection.cursor()
        
        # SQL-запрос для получения статуса пользователя
        query = """
        SELECT u.is_admin
        FROM identifiers i
        JOIN users u ON i.user_id = u.id
        WHERE i.identifier = %s;
        """
        print(f"[DEBUG] Выполняем запрос: {query}")
        cursor.execute(query, (user_key,))
        result = cursor.fetchone()
        print(f"[DEBUG] Результат запроса: {result}")
        
        # Проверяем, найден ли пользователь
        if not result:
            print("[ERROR] Пользователь с указанным ключом не найден.")
            raise ValueError("Пользователь с указанным ключом не найден")

        is_admin = result[0]  # Получаем статус администратора
        print(f"[DEBUG] Статус пользователя успешно извлечён: {'администратор' if is_admin else 'обычный пользователь'}")
        return {"is_admin": is_admin}
    except Exception as e:
        print(f"[ERROR] Ошибка при проверке статуса пользователя: {e}")
        raise ValueError("Не удалось проверить статус пользователя")
    finally:
        print("[DEBUG] Закрываем курсор.")
        cursor.close()


def is_recipe_in_favourites(user_key, recipe_id):
    """
    Проверяет, добавлен ли рецепт в избранное у пользователя.
    :param user_key: Идентификатор пользователя.
    :param recipe_id: ID рецепта.
    :return: Словарь с информацией {"is_favourite": bool}.
    """
    global db_connection
    try:
        print("[DEBUG] Функция is_recipe_in_favourites вызвана.")
        print(f"[DEBUG] Получен user_key: {user_key}, recipe_id: {recipe_id}")
        
        # Проверяем входные данные
        if not user_key:
            print("[ERROR] Ключ пользователя не предоставлен.")
            raise ValueError("Ключ пользователя не предоставлен")
        if not recipe_id:
            print("[ERROR] ID рецепта не предоставлен.")
            raise ValueError("ID рецепта не предоставлен")
        
        # Открываем курсор для выполнения запроса
        print("[DEBUG] Открываем курсор для выполнения запроса.")
        cursor = db_connection.cursor()
        
        # SQL-запрос для получения ID пользователя
        query_user = """
        SELECT user_id 
        FROM identifiers 
        WHERE identifier = %s;
        """
        print(f"[DEBUG] Выполняем запрос для получения user_id: {query_user}")
        cursor.execute(query_user, (user_key,))
        user_id = cursor.fetchone()
        
        # Проверяем, найден ли пользователь
        if not user_id:
            print("[ERROR] Пользователь с указанным ключом не найден.")
            raise ValueError("Пользователь с указанным ключом не найден")
        user_id = user_id[0]
        print(f"[DEBUG] Пользователь найден: user_id = {user_id}")
        
        # SQL-запрос для проверки, находится ли рецепт в избранном
        query_favourite = """
        SELECT 1 
        FROM favorite 
        WHERE user_id = %s AND recipe_id = %s;
        """
        print(f"[DEBUG] Выполняем запрос для проверки избранного: {query_favourite}")
        cursor.execute(query_favourite, (user_id, recipe_id))
        is_favourite = cursor.fetchone() is not None
        
        print(f"[DEBUG] Результат проверки: {'есть в избранном' if is_favourite else 'нет в избранном'}")
        return {"is_favourite": is_favourite}
    except Exception as e:
        print(f"[ERROR] Ошибка при проверке избранного: {e}")
        raise ValueError("Не удалось проверить избранное")
    finally:
        print("[DEBUG] Закрываем курсор.")
        cursor.close()


def get_user_list(user_key):
    """
    Получает список пользователей, если запрашивающий является администратором.
    :param admin_key: Идентификатор администратора для проверки прав.
    :return: Словарь с информацией о пользователях.
    """
    global db_connection
    try:
        print("[DEBUG] Функция get_user_list вызвана.")
        print(f"[DEBUG] Получен user_key: {user_key}")
        
        # Проверяем входные данные
        if not user_key:
            print("[ERROR] Ключ пользователя не предоставлен.")
            raise ValueError("Ключ пользователя не предоставлен")
        
        # Открываем курсор для выполнения запроса
        print("[DEBUG] Открываем курсор для выполнения запроса.")
        cursor = db_connection.cursor()

        # Если передан user_key, проверяем, является ли пользователь администратором
        if user_key:
            # Проверка user_key
            cursor.execute("SELECT user_id FROM identifiers WHERE identifier = %s;", (user_key,))
            result = cursor.fetchone()
            if not result:
                print("[ERROR] Неверный ключ администратора.")
                raise ValueError("Неверный ключ администратора")
            user_id = result[0]

            # Проверка прав администратора
            cursor.execute("SELECT is_admin FROM users WHERE id = %s;", (user_id,))
            admin_status = cursor.fetchone()
            if not admin_status or not admin_status[0]:
                print("[ERROR] Недостаточно прав.")
                raise ValueError("Недостаточно прав для выполнения операции.")
            print("[DEBUG] Администраторские права подтверждены.")

        # SQL-запрос для получения пользователей
        query_user = """
        SELECT name 
        FROM users 
        """
        print(f"[DEBUG] Выполняем запрос для получения пользователей: {query_user}")
        cursor.execute(query_user, ())
        users = cursor.fetchall()  
        
        # Проверяем, найдены ли пользователи
        if not users:
            print("[ERROR] Пользователь с указанным ключом не найден.")
            raise ValueError("Пользователь с указанным ключом не найден")
        
        user_list = []

        for user in users:
            # Формируем список пользователей
            user_list.append({"name": user[0]})
        
        print(f"[DEBUG] Получен список пользователей: {user_list}")
        return {"users": user_list}
    
    except Exception as e:
        print(f"[ERROR] Ошибка при получении списка пользователей: {e}")
        raise ValueError("Не удалось получить список пользователей")
    
    finally:
        print("[DEBUG] Закрываем курсор.")
        cursor.close()


"""

block of api server class

"""

class Exchanger_server(HTTP_handler):
    def do_POST(self):
        print(f"Received POST request to {self.path}:")
        print(f"Headers: {self.headers}")
        try:
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length).decode('utf-8')
            data = loads(body)
            print(f"Body: {data}")
        except:
            return self.send_bad_response("Invalid JSON")

        try:
            if self.path == "/admin/new/recipe":
                response_data = new_recipe(self.headers.get("X-USER-KEY"), data.get("name"), data.get("description") , data.get("ingredients"), data.get("way_to_cook"), data.get("image"))
            elif self.path == "/register":
                response_data = new_user(data.get("user_name"), data.get("user_password"))
            elif self.path == "/admin/new/superuser":
                response_data = new_admin(self.headers.get("X-USER-KEY"), data.get("name"))
            elif self.path == "/user/recipe/addToFavorite":
                response_data = add_recipe_to_favorites(self.headers.get("X-USER-KEY"), data.get("recipe_id"))
            elif self.path == "/login":
                response_data = get_user_indent(data.get("user_name"), data.get("user_password"))
            elif self.path == "/user/filter":
                response_data = get_recipe_by_filter(data.get("good_ingredients"), data.get("bad_ingredients"))
            elif self.path == "/recipe":
                response_data = get_recipe_details(data.get("recipe_id"))
            else:
                raise ValueError("Not found")
        except Exception as e:
            return self.send_bad_response(e)
        self.send_good_response(response_data)

    def do_GET(self):
        print(f"Received GET request to {self.path}:")
        print(f"Headers: {self.headers}")
        try:
            if self.path == "/ingredients":
                response_data = get_ingredients()
            elif self.path == "/recipe" or self.path == "/admin/recipe" or self.path == "/user/recipe":
                response_data = get_recipe()
            elif self.path == "/user/favorite":
                response_data = get_favourite(self.headers.get("X-USER-KEY"))
            elif self.path == "/status":
                response_data = get_status(self.headers.get("X-USER-KEY"))
            elif self.path == "/user/favorite/check":
                response_data = is_recipe_in_favourites(self.headers.get("X-USER-KEY"), self.headers.get("id"))
            elif self.path == "/userList":
                response_data = get_user_list(self.headers.get("X-USER-KEY"))
            else:
                raise ValueError("Not Found")
        except Exception as ex:
            return self.send_bad_response(ex)
        self.send_good_response(response_data)

    def do_DELETE(self):
        print(f"Received DELETE request to {self.path}:")
        print(f"Headers: {self.headers}")
        try:
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length).decode('utf-8')
            data = loads(body)
            print(f"Body: {data}")
            if self.path == "/admin/del/recipe":
                res = delete_recipe(self.headers.get("X-USER-KEY"), data.get("recipe_id"))
            elif self.path == "/user/recipe/delFavorite":
                res = remove_favorite(self.headers.get("X-USER-KEY"), data.get("recipe_id"))
            else:
                raise ValueError("Not Found")
        except Exception as e:
            return self.send_bad_response(e)
        self.send_good_response(res)

    def send_good_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        if data:
            self.wfile.write(dumps(data, ensure_ascii=False).encode('utf-8')) #if receive smth wrong change this line

    def send_bad_response(self, error):
        self.send_response(400)
        self.end_headers()
        self.wfile.write(str(error).encode())


db_connection = None

DB_CONFIG = {
    'dbname': 'root',
    'user': 'root',
    'password': 'root',
    'host': 'db',
    'port': 5432
}


def initialize_db_connection():
    global db_connection
    try:
        db_connection = psycopg2.connect(**DB_CONFIG)
        print("Успешное подключение к базе данных.")
    except Exception as e:
        print(f"Ошибка подключения к базе данных: {e}")
        exit(1)

def close_db_connection():
    global db_connection
    if db_connection:
        db_connection.close()
        print("Соединение с базой данных закрыто.")


def main():
    sleep(5)
    try:
        initialize_db_connection()

        server_address = ('0.0.0.0', 5252)
        httpd = HTTPServer(server_address, Exchanger_server)
        print("Сервер запущен на порту 5252...")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nОстановка сервера...")
    finally:
        # Закрытие соединения с БД
        close_db_connection()


if __name__ == "__main__":
    main()
