import requests
from flask import Flask, request, jsonify
from cfg import TELEGRAM_API_URL
from waitress import serve

app = Flask(__name__)

def send_telegram_message(chat_id: str, text: str) -> bool:
    try:
        #print(f"Пытаюсь отправить сообщение для chat_id: {chat_id}")
        response = requests.post(
            TELEGRAM_API_URL,
            json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "Markdown"
            },
            timeout=5
        )
        #print(f"Ответ Telegram API: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        #print(f"Ошибка отправки в Telegram: {str(e)}")
        return False

@app.route('/api/notify', methods=['POST'])
def handle_notification():
    try:
        data = request.get_json()
        #print(f"Получены данные: {data}")
        
        if not data:
            return jsonify({"error": "Empty request body"}), 400
            
        if 'chat_id' not in data or 'message' not in data:
            return jsonify({"error": "Missing chat_id or message"}), 400
        
        success = send_telegram_message(data['chat_id'], data['message'])
        
        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to send notification",
                "chat_id": data['chat_id'], 
                "message": data['message'][:50] + "..." if len(data['message']) > 50 else data['message']
            }), 500
            
        return jsonify({"success": True}), 200
        
    except Exception as e:
        print(f"[CRITICAL] Ошибка в обработчике: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    serve(app, host="0.0.0.0", port=15001)
