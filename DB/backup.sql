--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

-- Started on 2024-12-24 20:59:26 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 16385)
-- Name: favorite; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.favorite (
    id integer NOT NULL,
    user_id integer NOT NULL,
    recipe_id integer NOT NULL
);


ALTER TABLE public.favorite OWNER TO root;

--
-- TOC entry 218 (class 1259 OID 16388)
-- Name: favorite_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.favorite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorite_id_seq OWNER TO root;

--
-- TOC entry 3421 (class 0 OID 0)
-- Dependencies: 218
-- Name: favorite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.favorite_id_seq OWNED BY public.favorite.id;


--
-- TOC entry 219 (class 1259 OID 16389)
-- Name: identifiers; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.identifiers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    identifier text NOT NULL
);


ALTER TABLE public.identifiers OWNER TO root;

--
-- TOC entry 220 (class 1259 OID 16394)
-- Name: identifiers_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.identifiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.identifiers_id_seq OWNER TO root;

--
-- TOC entry 3422 (class 0 OID 0)
-- Dependencies: 220
-- Name: identifiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.identifiers_id_seq OWNED BY public.identifiers.id;


--
-- TOC entry 221 (class 1259 OID 16395)
-- Name: ingredients; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.ingredients (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.ingredients OWNER TO root;

--
-- TOC entry 222 (class 1259 OID 16400)
-- Name: ingredients_for_recipes; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.ingredients_for_recipes (
    id integer NOT NULL,
    ingredient_id integer,
    recipe_id integer,
    quantity text NOT NULL,
    unit text NOT NULL
);


ALTER TABLE public.ingredients_for_recipes OWNER TO root;

--
-- TOC entry 223 (class 1259 OID 16405)
-- Name: ingredients_for_recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.ingredients_for_recipes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredients_for_recipes_id_seq OWNER TO root;

--
-- TOC entry 3423 (class 0 OID 0)
-- Dependencies: 223
-- Name: ingredients_for_recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.ingredients_for_recipes_id_seq OWNED BY public.ingredients_for_recipes.id;


--
-- TOC entry 224 (class 1259 OID 16406)
-- Name: ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.ingredients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredients_id_seq OWNER TO root;

--
-- TOC entry 3424 (class 0 OID 0)
-- Dependencies: 224
-- Name: ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.ingredients_id_seq OWNED BY public.ingredients.id;


--
-- TOC entry 225 (class 1259 OID 16407)
-- Name: recipes; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.recipes (
    id integer NOT NULL,
    name text NOT NULL,
    way_to_cook text NOT NULL,
    description text DEFAULT 'описание'::text NOT NULL,
    image text
);


ALTER TABLE public.recipes OWNER TO root;

--
-- TOC entry 226 (class 1259 OID 16413)
-- Name: recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.recipes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipes_id_seq OWNER TO root;

--
-- TOC entry 3425 (class 0 OID 0)
-- Dependencies: 226
-- Name: recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.recipes_id_seq OWNED BY public.recipes.id;


--
-- TOC entry 227 (class 1259 OID 16414)
-- Name: users; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    passwd text NOT NULL,
    is_admin boolean NOT NULL
);


ALTER TABLE public.users OWNER TO root;

--
-- TOC entry 228 (class 1259 OID 16419)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO root;

--
-- TOC entry 3426 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3235 (class 2604 OID 16420)
-- Name: favorite id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.favorite ALTER COLUMN id SET DEFAULT nextval('public.favorite_id_seq'::regclass);


--
-- TOC entry 3236 (class 2604 OID 16421)
-- Name: identifiers id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.identifiers ALTER COLUMN id SET DEFAULT nextval('public.identifiers_id_seq'::regclass);


--
-- TOC entry 3237 (class 2604 OID 16422)
-- Name: ingredients id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.ingredients ALTER COLUMN id SET DEFAULT nextval('public.ingredients_id_seq'::regclass);


--
-- TOC entry 3238 (class 2604 OID 16423)
-- Name: ingredients_for_recipes id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.ingredients_for_recipes ALTER COLUMN id SET DEFAULT nextval('public.ingredients_for_recipes_id_seq'::regclass);


--
-- TOC entry 3239 (class 2604 OID 16424)
-- Name: recipes id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.recipes ALTER COLUMN id SET DEFAULT nextval('public.recipes_id_seq'::regclass);


--
-- TOC entry 3241 (class 2604 OID 16425)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3404 (class 0 OID 16385)
-- Dependencies: 217
-- Data for Name: favorite; Type: TABLE DATA; Schema: public; Owner: root
--


--
-- TOC entry 3406 (class 0 OID 16389)
-- Dependencies: 219
-- Data for Name: identifiers; Type: TABLE DATA; Schema: public; Owner: root
--

INSERT INTO public.identifiers (id, user_id, identifier) VALUES (1, 1, '05d53a23057a1aa7d634b1092ca3928e88ebde19ee50b85776fc49d8a5e59d48');


--
-- TOC entry 3408 (class 0 OID 16395)
-- Dependencies: 221
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: root
--

INSERT INTO public.ingredients (id, name) VALUES (2, 'лук');
INSERT INTO public.ingredients (id, name) VALUES (3, 'перец чёрный');
INSERT INTO public.ingredients (id, name) VALUES (4, 'макароны');
INSERT INTO public.ingredients (id, name) VALUES (5, 'говяжий фарш');
INSERT INTO public.ingredients (id, name) VALUES (6, 'соль');
INSERT INTO public.ingredients (id, name) VALUES (7, 'картофель');
INSERT INTO public.ingredients (id, name) VALUES (8, 'томаты');
INSERT INTO public.ingredients (id, name) VALUES (9, 'капуста');
INSERT INTO public.ingredients (id, name) VALUES (10, 'свекла');
INSERT INTO public.ingredients (id, name) VALUES (11, 'морковь');
INSERT INTO public.ingredients (id, name) VALUES (12, 'свинина');
INSERT INTO public.ingredients (id, name) VALUES (36, 'Говядина');
INSERT INTO public.ingredients (id, name) VALUES (37, 'Сливочное масло');
INSERT INTO public.ingredients (id, name) VALUES (38, 'Лук');
INSERT INTO public.ingredients (id, name) VALUES (39, 'Морковь');
INSERT INTO public.ingredients (id, name) VALUES (40, 'Хлебцы');


--
-- TOC entry 3409 (class 0 OID 16400)
-- Dependencies: 222
-- Data for Name: ingredients_for_recipes; Type: TABLE DATA; Schema: public; Owner: root
--

INSERT INTO public.ingredients_for_recipes (id, ingredient_id, recipe_id, quantity, unit) VALUES (83, 36, 57, '400', 'граммов');
INSERT INTO public.ingredients_for_recipes (id, ingredient_id, recipe_id, quantity, unit) VALUES (84, 37, 57, '20', 'граммов');
INSERT INTO public.ingredients_for_recipes (id, ingredient_id, recipe_id, quantity, unit) VALUES (85, 38, 57, '1', 'шт');
INSERT INTO public.ingredients_for_recipes (id, ingredient_id, recipe_id, quantity, unit) VALUES (86, 39, 57, '1', 'шт');
INSERT INTO public.ingredients_for_recipes (id, ingredient_id, recipe_id, quantity, unit) VALUES (87, 40, 57, '15', 'шт');


--
-- TOC entry 3412 (class 0 OID 16407)
-- Dependencies: 225
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: root
--


INSERT INTO public.recipes (id, name, way_to_cook, description, image) VALUES (57, 'Фаршированные "жулики"', 'Жуликами» раньше в Москве называли маленькие порционные хлебцы. Филе говядины нарезать самыми маленькими кусочками, добавить мелко рубленного и поджаренного на сливочном масле лука, соли, перца, перемешать, нафаршировать хлебцы', 'Нафаршировать хлебцы - мясом говядины, луком и морковью', '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
SZfAvQ53vG7ZOXzzsw/bZbu/vjoJAHC+0Hmub57z5en/+pu/8Nf++v+ec/7e3/a1PD5b19Xdl/WS
MsQkx1nfMh+3W7wQmHN6Xpbl3du3mej5TTCi6yfPsle1kIWL4ev7W4xsw3lZeLmK26/80jf+0L/x
H9vypeO857iM0dbtUo/zcrm87vcQgvbx5XfPf/hf+hdijKMDMRBBSsttf/mRH/nR7/me77nte8xp
tKqq+3k4y72eIcVaaoqy73sd9d3lUkthlbyk15fbumRHGtq3bUkp7WcZtZLwvp8phXVZAGA/PuSU
iDA4SAxzR2GGv23bjuOYp2IuAgYmMA9B+hhMosMGDER8erri07qUUsw851RKZaY5v2PGD7f7ZVmP
4yCCGHPvlUhUHdGv1+v9fldVDkmI6qiCUlq7rKsjAmGvbe4kkbCrlVK2y9JLfb4+uXYRKb1FFsa5
hBj3fc9xIfaz1Hdvv6Q+jvPknM/amRGA5qY1oBmGp+vWuiHof/pn/hNB6V21AaARBmdyMHIYQw2g
j7atT3NSnnJow5jRuhkaMi0hau/3/bXW00rbj5JT+tf+9T+c0/oAuaL+1q995Qf/sV//7mlBWc3b
Jcsw1e4O8o3PvoHK3brEkEKOLOsSzCwmRoiffPouBarD79/8ZYlr2N72UZ8/eX59/4HT9k//wX+H
3nyKEkqrjDSJX2aGyFMJgkCM6A9/YXBHdEOeSQ51HcxsAL/rd/3u3/6P/w5kKrX+6T/7F//Gz/+V
19tnURIiHvfXLcYlx1b6ti3nWVsr7p5znmtUqrofdwnZbPTen66XUspRy+VyqWd5oIdjOPYSWUJe
Pry+zDHxsiz7vrvrdclR5DxPMxd6MOhnAMV1SdqUGQHADIig9x4ltKHudrls9/uek/QBABZjrKML
UoyRkRzpOO6T4KDac14NYIp73H1ZljHGy+313dtPzlq0j3XL7WxEgMiZiFOcvuKApsMRNKdr0d5G
jzGqOwHEkIc2AyKHlJIh7PsZAoe4EOGf+uk/V857CAl09DoQADkaKaiv61JaTyx7Ha41LUuvlZHU
bdY+vXd0CygDbFnyH/wDP2pmKaXjuJtZXPJoxYaiaWiv/95P/PDbLYQUSdLtw4d8iUSU4kJOt/vL
APdenp/flVJEqLWRE6Bsb7/4rt4/ADFg0hQIYykf+O1v/uEf+5ebGjPX0fO61NLneXlgYPEhuEsx
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
PwAAAABJRU5ErkJggg==
');


--
-- TOC entry 3414 (class 0 OID 16414)
-- Dependencies: 227
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: root
--

INSERT INTO public.users (id, name, passwd, is_admin) VALUES (1, 'root', 'goool', true);

--
-- TOC entry 3427 (class 0 OID 0)
-- Dependencies: 218
-- Name: favorite_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.favorite_id_seq', 44, true);


--
-- TOC entry 3428 (class 0 OID 0)
-- Dependencies: 220
-- Name: identifiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.identifiers_id_seq', 21, true);


--
-- TOC entry 3429 (class 0 OID 0)
-- Dependencies: 223
-- Name: ingredients_for_recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.ingredients_for_recipes_id_seq', 93, true);


--
-- TOC entry 3430 (class 0 OID 0)
-- Dependencies: 224
-- Name: ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.ingredients_id_seq', 40, true);


--
-- TOC entry 3431 (class 0 OID 0)
-- Dependencies: 226
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.recipes_id_seq', 59, true);


--
-- TOC entry 3432 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.users_id_seq', 21, true);


--
-- TOC entry 3243 (class 2606 OID 16427)
-- Name: favorite favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.favorite
    ADD CONSTRAINT favorite_pkey PRIMARY KEY (id);


--
-- TOC entry 3245 (class 2606 OID 16429)
-- Name: identifiers identifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.identifiers
    ADD CONSTRAINT identifiers_pkey PRIMARY KEY (id);


--
-- TOC entry 3249 (class 2606 OID 16431)
-- Name: ingredients_for_recipes ingredients_for_recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.ingredients_for_recipes
    ADD CONSTRAINT ingredients_for_recipes_pkey PRIMARY KEY (id);


--
-- TOC entry 3247 (class 2606 OID 16433)
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- TOC entry 3251 (class 2606 OID 16435)
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- TOC entry 3253 (class 2606 OID 16437)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3257 (class 2606 OID 16438)
-- Name: ingredients_for_recipes ingredients_connect; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.ingredients_for_recipes
    ADD CONSTRAINT ingredients_connect FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id);


--
-- TOC entry 3254 (class 2606 OID 16443)
-- Name: favorite recipe_connect; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.favorite
    ADD CONSTRAINT recipe_connect FOREIGN KEY (recipe_id) REFERENCES public.recipes(id);


--
-- TOC entry 3258 (class 2606 OID 16448)
-- Name: ingredients_for_recipes recipes_connect; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.ingredients_for_recipes
    ADD CONSTRAINT recipes_connect FOREIGN KEY (recipe_id) REFERENCES public.recipes(id);


--
-- TOC entry 3255 (class 2606 OID 16453)
-- Name: favorite user_connect; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.favorite
    ADD CONSTRAINT user_connect FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3256 (class 2606 OID 16458)
-- Name: identifiers users_connect; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.identifiers
    ADD CONSTRAINT users_connect FOREIGN KEY (user_id) REFERENCES public.users(id);


-- Completed on 2024-12-24 20:59:26 UTC

--
-- PostgreSQL database dump complete
--

