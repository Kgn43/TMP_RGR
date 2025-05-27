--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

-- Started on 2025-05-17 11:21:05 UTC

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
-- Name: departments; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    "Name" character varying(50) NOT NULL,
    "Floor" integer NOT NULL,
    "Responsible_employee_id" integer NOT NULL
);


ALTER TABLE public.departments OWNER TO root;

--
-- TOC entry 218 (class 1259 OID 16388)
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO root;

--
-- TOC entry 3409 (class 0 OID 0)
-- Dependencies: 218
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- TOC entry 219 (class 1259 OID 16389)
-- Name: employees; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    "Name" character varying(20) NOT NULL,
    "Surname" character varying(20) NOT NULL,
    "Role" integer NOT NULL,
    "Phone_number" character varying(20),
    "Telegram_id" character varying(20),
    "Login" character varying(50) NOT NULL,
    "Passwd" text NOT NULL
);


ALTER TABLE public.employees OWNER TO root;

--
-- TOC entry 220 (class 1259 OID 16392)
-- Name: employess_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.employess_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employess_id_seq OWNER TO root;

--
-- TOC entry 3410 (class 0 OID 0)
-- Dependencies: 220
-- Name: employess_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.employess_id_seq OWNED BY public.employees.id;


--
-- TOC entry 221 (class 1259 OID 16393)
-- Name: issues; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.issues (
    id integer NOT NULL,
    "Department_id" integer NOT NULL,
    "Created_at" timestamp without time zone NOT NULL,
    "Status" integer NOT NULL,
    "Description" character varying(100) NOT NULL
);


ALTER TABLE public.issues OWNER TO root;

--
-- TOC entry 222 (class 1259 OID 16396)
-- Name: issues_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.issues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.issues_id_seq OWNER TO root;

--
-- TOC entry 3411 (class 0 OID 0)
-- Dependencies: 222
-- Name: issues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.issues_id_seq OWNED BY public.issues.id;


--
-- TOC entry 223 (class 1259 OID 16397)
-- Name: roles; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    "Role" character varying(20) NOT NULL
);


ALTER TABLE public.roles OWNER TO root;

--
-- TOC entry 224 (class 1259 OID 16400)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO root;

--
-- TOC entry 3412 (class 0 OID 0)
-- Dependencies: 224
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 225 (class 1259 OID 16401)
-- Name: statuses; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.statuses (
    id integer NOT NULL,
    "Status" character varying(20) NOT NULL
);


ALTER TABLE public.statuses OWNER TO root;

--
-- TOC entry 226 (class 1259 OID 16404)
-- Name: statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.statuses_id_seq OWNER TO root;

--
-- TOC entry 3413 (class 0 OID 0)
-- Dependencies: 226
-- Name: statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.statuses_id_seq OWNED BY public.statuses.id;


--
-- TOC entry 3230 (class 2604 OID 16405)
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 3231 (class 2604 OID 16406)
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employess_id_seq'::regclass);


--
-- TOC entry 3232 (class 2604 OID 16407)
-- Name: issues id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.issues ALTER COLUMN id SET DEFAULT nextval('public.issues_id_seq'::regclass);


--
-- TOC entry 3233 (class 2604 OID 16408)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 3234 (class 2604 OID 16409)
-- Name: statuses id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.statuses ALTER COLUMN id SET DEFAULT nextval('public.statuses_id_seq'::regclass);


--
-- TOC entry 3394 (class 0 OID 16385)
-- Dependencies: 217
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: root
--

INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (1, 'Магазин одежды "Cropp"', 1, 2);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (2, 'Бутик "Zara"', 1, 2);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (3, 'Магазин электроники "Samsung"', 1, 2);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (4, 'Ювелирный магазин "Sokolov"', 1, 2);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (5, 'Спортивный магазин "Adidas"', 1, 2);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (6, 'Книжный магазин "Читай-город"', 1, 2);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (7, 'Детский магазин "Детский мир"', 1, 2);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (8, 'Аптека "36,6"', 1, 2);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (9, 'Супермаркет "ВкусВилл"', 1, 2);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (10, 'Магазин косметики "Lush"', 2, 3);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (11, 'Магазин бытовой техники "Miele"', 2, 3);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (12, 'Салон оптики "Линзмастер"', 2, 3);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (13, 'Пекарня "Буше"', 2, 3);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (14, 'Зоомагазин "4 Лапы"', 2, 3);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (15, 'Магазин игрушек "LEGO"', 2, 3);
INSERT INTO public.departments (id, "Name", "Floor", "Responsible_employee_id") VALUES (16, 'Цветочный магазин "Букет"', 2, 3);


--
-- TOC entry 3396 (class 0 OID 16389)
-- Dependencies: 219
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: root
--

INSERT INTO public.employees (id, "Name", "Surname", "Role", "Phone_number", "Telegram_id", "Login", "Passwd") VALUES (1, 'Фёдор', 'Мокрецов', 1, '89635749737', '1169347875', 'kgn', '1234');
INSERT INTO public.employees (id, "Name", "Surname", "Role", "Phone_number", "Telegram_id", "Login", "Passwd") VALUES (2, 'Данил', 'Пономаренко', 2, '89236589058', '1169347875', 'era', 'qwerty');
INSERT INTO public.employees (id, "Name", "Surname", "Role", "Phone_number", "Telegram_id", "Login", "Passwd") VALUES (3, 'Илья', 'Дорош', 2, '89132131991', '1169347875', 'onlylucky', 'q1w2e3r4');


--
-- TOC entry 3398 (class 0 OID 16393)
-- Dependencies: 221
-- Data for Name: issues; Type: TABLE DATA; Schema: public; Owner: root
--



--
-- TOC entry 3400 (class 0 OID 16397)
-- Dependencies: 223
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: root
--

INSERT INTO public.roles (id, "Role") VALUES (1, 'administrator');
INSERT INTO public.roles (id, "Role") VALUES (2, 'security guard');


--
-- TOC entry 3402 (class 0 OID 16401)
-- Dependencies: 225
-- Data for Name: statuses; Type: TABLE DATA; Schema: public; Owner: root
--

INSERT INTO public.statuses (id, "Status") VALUES (1, 'registered');
INSERT INTO public.statuses (id, "Status") VALUES (2, 'resolved');


--
-- TOC entry 3414 (class 0 OID 0)
-- Dependencies: 218
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.departments_id_seq', 16, true);


--
-- TOC entry 3415 (class 0 OID 0)
-- Dependencies: 220
-- Name: employess_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.employess_id_seq', 3, true);


--
-- TOC entry 3416 (class 0 OID 0)
-- Dependencies: 222
-- Name: issues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.issues_id_seq', 1, false);


--
-- TOC entry 3417 (class 0 OID 0)
-- Dependencies: 224
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.roles_id_seq', 2, true);


--
-- TOC entry 3418 (class 0 OID 0)
-- Dependencies: 226
-- Name: statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.statuses_id_seq', 2, true);


--
-- TOC entry 3236 (class 2606 OID 16411)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 3238 (class 2606 OID 16413)
-- Name: employees employess_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employess_pkey PRIMARY KEY (id);


--
-- TOC entry 3240 (class 2606 OID 16415)
-- Name: issues issues_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_pkey PRIMARY KEY (id);


--
-- TOC entry 3242 (class 2606 OID 16417)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3244 (class 2606 OID 16419)
-- Name: statuses statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_pkey PRIMARY KEY (id);


--
-- TOC entry 3246 (class 2606 OID 16420)
-- Name: employees employees_role; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_role FOREIGN KEY ("Role") REFERENCES public.roles(id) NOT VALID;


--
-- TOC entry 3247 (class 2606 OID 16425)
-- Name: issues issues_departments; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_departments FOREIGN KEY ("Department_id") REFERENCES public.departments(id) NOT VALID;


--
-- TOC entry 3248 (class 2606 OID 16430)
-- Name: issues issues_statuses; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_statuses FOREIGN KEY ("Status") REFERENCES public.statuses(id) NOT VALID;


--
-- TOC entry 3245 (class 2606 OID 16435)
-- Name: departments responsible; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT responsible FOREIGN KEY ("Responsible_employee_id") REFERENCES public.employees(id) NOT VALID;


-- Completed on 2025-05-17 11:21:05 UTC

--
-- PostgreSQL database dump complete
--

