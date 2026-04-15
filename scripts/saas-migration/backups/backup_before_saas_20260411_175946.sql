--
-- PostgreSQL database dump
--

\restrict AkVl8JJFCWHxEmV43DAijiE8w8IAvI0QJ7lTjA8LhrfsRzck2x2fWMKBbPU7RwW

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_users OWNER TO postgres;

--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_users_id_seq OWNER TO postgres;

--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: ai_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_config (
    id integer NOT NULL,
    bot_name text DEFAULT 'مساعد المتجر'::text NOT NULL,
    personality text,
    greeting_message text,
    language text DEFAULT 'auto'::text NOT NULL,
    respond_to_orders integer DEFAULT 1 NOT NULL,
    reply_to_comments integer DEFAULT 1 NOT NULL,
    send_dm_on_comment integer DEFAULT 1 NOT NULL,
    active_provider_id integer,
    business_country text,
    business_city text,
    business_domain text,
    business_domain_custom text,
    target_audience text,
    business_hours_start text DEFAULT '09:00'::text,
    business_hours_end text DEFAULT '22:00'::text,
    timezone text DEFAULT 'Africa/Algiers'::text NOT NULL,
    outside_hours_message text,
    currency text DEFAULT 'DZD'::text NOT NULL,
    page_name text,
    page_description text,
    page_logo_url text,
    page_facebook_url text,
    strict_topic_mode integer DEFAULT 0 NOT NULL,
    off_topic_response text,
    blocked_keywords text,
    max_off_topic_messages integer DEFAULT 3 NOT NULL,
    handoff_keyword text DEFAULT 'بشري'::text,
    handoff_message text DEFAULT 'تم تحويلك إلى فريق الدعم البشري. سيتواصل معك أحد ممثلينا قريباً.'::text,
    current_plan text DEFAULT 'free'::text NOT NULL,
    lead_capture_enabled integer DEFAULT 0 NOT NULL,
    lead_capture_fields text DEFAULT '["phone"]'::text NOT NULL,
    lead_capture_message text DEFAULT 'يسعدنا خدمتك! هل يمكنك مشاركتنا رقم هاتفك للتواصل؟'::text,
    use_quick_replies integer DEFAULT 1 NOT NULL,
    quick_reply_buttons text,
    working_hours_enabled integer DEFAULT 1 NOT NULL,
    abandoned_cart_enabled integer DEFAULT 1 NOT NULL,
    abandoned_cart_delay_hours integer DEFAULT 1 NOT NULL,
    abandoned_cart_message text DEFAULT 'مرحباً! 👋 لاحظنا اهتمامك بـ {product_name}
هل تريد إتمام طلبك؟ نحن هنا لمساعدتك 😊'::text,
    bot_enabled integer DEFAULT 1 NOT NULL,
    bot_disabled_message text DEFAULT 'عذراً، المساعد الذكي غير متاح حالياً. يرجى التواصل معنا لاحقاً.'::text,
    confidence_threshold text DEFAULT '0.5'::text NOT NULL,
    confidence_below_action text DEFAULT 'none'::text NOT NULL,
    safe_mode_enabled integer DEFAULT 0 NOT NULL,
    safe_mode_level text DEFAULT 'standard'::text NOT NULL,
    customer_memory_enabled integer DEFAULT 0 NOT NULL,
    sales_boost_enabled integer DEFAULT 0 NOT NULL,
    sales_boost_level text DEFAULT 'medium'::text NOT NULL,
    price_lock_enabled integer DEFAULT 0 NOT NULL,
    human_guarantee_enabled integer DEFAULT 0 NOT NULL,
    smart_escalation_enabled integer DEFAULT 0 NOT NULL,
    delivery_enabled integer DEFAULT 0 NOT NULL,
    appointments_enabled integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.ai_config OWNER TO postgres;

--
-- Name: ai_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_config_id_seq OWNER TO postgres;

--
-- Name: ai_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_config_id_seq OWNED BY public.ai_config.id;


--
-- Name: ai_providers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_providers (
    id integer NOT NULL,
    name text NOT NULL,
    provider_type text NOT NULL,
    api_key text DEFAULT ''::text NOT NULL,
    base_url text,
    model_name text NOT NULL,
    is_active integer DEFAULT 0 NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    is_enabled integer DEFAULT 1 NOT NULL,
    fail_count integer DEFAULT 0 NOT NULL,
    last_used_at text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_providers OWNER TO postgres;

--
-- Name: ai_providers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_providers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_providers_id_seq OWNER TO postgres;

--
-- Name: ai_providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_providers_id_seq OWNED BY public.ai_providers.id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    fb_user_id text NOT NULL,
    fb_user_name text,
    fb_profile_url text,
    service_name text,
    appointment_date text,
    time_slot text,
    status text DEFAULT 'pending'::text NOT NULL,
    note text,
    source text DEFAULT 'messenger'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: available_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.available_slots (
    id integer NOT NULL,
    day_of_week integer NOT NULL,
    time_slot text NOT NULL,
    is_active integer DEFAULT 1 NOT NULL,
    max_bookings integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.available_slots OWNER TO postgres;

--
-- Name: available_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.available_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.available_slots_id_seq OWNER TO postgres;

--
-- Name: available_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.available_slots_id_seq OWNED BY public.available_slots.id;


--
-- Name: broadcast_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.broadcast_templates (
    id integer NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'offers'::text NOT NULL,
    message_text text NOT NULL,
    created_at text NOT NULL
);


ALTER TABLE public.broadcast_templates OWNER TO postgres;

--
-- Name: broadcast_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.broadcast_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.broadcast_templates_id_seq OWNER TO postgres;

--
-- Name: broadcast_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.broadcast_templates_id_seq OWNED BY public.broadcast_templates.id;


--
-- Name: broadcasts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.broadcasts (
    id integer NOT NULL,
    title text NOT NULL,
    message_text text NOT NULL,
    image_url text,
    target_filter text DEFAULT 'all'::text NOT NULL,
    target_label text,
    status text DEFAULT 'draft'::text NOT NULL,
    sent_count integer DEFAULT 0 NOT NULL,
    total_recipients integer DEFAULT 0 NOT NULL,
    scheduled_at text,
    sent_at text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.broadcasts OWNER TO postgres;

--
-- Name: broadcasts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.broadcasts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.broadcasts_id_seq OWNER TO postgres;

--
-- Name: broadcasts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.broadcasts_id_seq OWNED BY public.broadcasts.id;


--
-- Name: comments_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments_log (
    id integer NOT NULL,
    post_id text,
    comment_id text,
    fb_user_id text NOT NULL,
    fb_user_name text,
    fb_profile_url text,
    comment_text text,
    ai_reply text,
    dm_sent integer DEFAULT 0 NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comments_log OWNER TO postgres;

--
-- Name: comments_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_log_id_seq OWNER TO postgres;

--
-- Name: comments_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_log_id_seq OWNED BY public.comments_log.id;


--
-- Name: conversation_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversation_sessions (
    id integer NOT NULL,
    fb_user_id text NOT NULL,
    session_start text NOT NULL,
    session_end text NOT NULL,
    message_count integer DEFAULT 0 NOT NULL,
    ai_calls_count integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.conversation_sessions OWNER TO postgres;

--
-- Name: conversation_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversation_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversation_sessions_id_seq OWNER TO postgres;

--
-- Name: conversation_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversation_sessions_id_seq OWNED BY public.conversation_sessions.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    fb_user_id text NOT NULL,
    fb_user_name text,
    fb_profile_url text,
    message text NOT NULL,
    sender text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    is_paused integer DEFAULT 0 NOT NULL,
    sentiment text,
    label text,
    confidence_score double precision,
    rescue_triggered integer DEFAULT 0 NOT NULL,
    safe_mode_blocked integer DEFAULT 0 NOT NULL,
    provider_name text,
    model_name text,
    source_type text,
    sales_trigger_type text,
    converted_to_order integer DEFAULT 0 NOT NULL,
    conversion_source text,
    conversion_value double precision,
    operator_note text
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: delivery_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_prices (
    id integer NOT NULL,
    wilaya_id integer NOT NULL,
    wilaya_name text NOT NULL,
    home_price integer DEFAULT 0 NOT NULL,
    office_price integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.delivery_prices OWNER TO postgres;

--
-- Name: delivery_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_prices_id_seq OWNER TO postgres;

--
-- Name: delivery_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_prices_id_seq OWNED BY public.delivery_prices.id;


--
-- Name: domain_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.domain_templates (
    id integer NOT NULL,
    domain text NOT NULL,
    template_name text NOT NULL,
    bot_name text NOT NULL,
    personality text NOT NULL,
    greeting_message text NOT NULL,
    sample_faqs text DEFAULT '[]'::text NOT NULL,
    sample_products text DEFAULT '[]'::text NOT NULL
);


ALTER TABLE public.domain_templates OWNER TO postgres;

--
-- Name: domain_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.domain_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.domain_templates_id_seq OWNER TO postgres;

--
-- Name: domain_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.domain_templates_id_seq OWNED BY public.domain_templates.id;


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faqs (
    id integer NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    category text,
    is_active integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.faqs OWNER TO postgres;

--
-- Name: faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faqs_id_seq OWNER TO postgres;

--
-- Name: faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faqs_id_seq OWNED BY public.faqs.id;


--
-- Name: fb_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fb_settings (
    id integer NOT NULL,
    page_access_token text,
    verify_token text,
    page_id text,
    app_secret text,
    updated_at timestamp with time zone
);


ALTER TABLE public.fb_settings OWNER TO postgres;

--
-- Name: fb_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fb_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fb_settings_id_seq OWNER TO postgres;

--
-- Name: fb_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fb_settings_id_seq OWNED BY public.fb_settings.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    fb_user_id text NOT NULL,
    fb_user_name text,
    fb_profile_url text,
    phone text,
    email text,
    label text DEFAULT 'new'::text NOT NULL,
    notes text,
    source text DEFAULT 'messenger'::text NOT NULL,
    last_interaction_at text,
    total_messages integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leads_id_seq OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: order_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_sessions (
    id integer NOT NULL,
    fb_user_id text NOT NULL,
    product_name text,
    product_id integer,
    quantity integer DEFAULT 1 NOT NULL,
    customer_name text,
    customer_phone text,
    customer_wilaya text,
    customer_commune text,
    customer_address text,
    delivery_type text,
    delivery_price integer,
    step text DEFAULT 'collecting'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_sessions OWNER TO postgres;

--
-- Name: order_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_sessions_id_seq OWNER TO postgres;

--
-- Name: order_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_sessions_id_seq OWNED BY public.order_sessions.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    fb_user_id text NOT NULL,
    fb_user_name text,
    fb_profile_url text,
    product_id integer,
    product_name text,
    unit_price real,
    quantity integer DEFAULT 1 NOT NULL,
    total_price real,
    status text DEFAULT 'pending'::text NOT NULL,
    note text,
    customer_name text,
    customer_phone text,
    customer_wilaya text,
    customer_commune text,
    customer_address text,
    delivery_type text,
    delivery_price real,
    source text DEFAULT 'messenger'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: platform_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_events (
    id integer NOT NULL,
    event_type text NOT NULL,
    fb_user_id text,
    detail text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.platform_events OWNER TO postgres;

--
-- Name: platform_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.platform_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.platform_events_id_seq OWNER TO postgres;

--
-- Name: platform_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.platform_events_id_seq OWNED BY public.platform_events.id;


--
-- Name: pre_order_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pre_order_sessions (
    fb_user_id text NOT NULL,
    product_id integer NOT NULL,
    product_name text,
    step text DEFAULT 'awaiting_name'::text NOT NULL,
    customer_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pre_order_sessions OWNER TO postgres;

--
-- Name: pre_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pre_orders (
    id integer NOT NULL,
    fb_user_id text NOT NULL,
    fb_user_name text,
    product_id integer,
    product_name text,
    customer_name text,
    phone text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.pre_orders OWNER TO postgres;

--
-- Name: pre_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pre_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pre_orders_id_seq OWNER TO postgres;

--
-- Name: pre_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pre_orders_id_seq OWNED BY public.pre_orders.id;


--
-- Name: processed_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.processed_messages (
    mid text NOT NULL,
    sender_id text NOT NULL,
    processed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.processed_messages OWNER TO postgres;

--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_categories (
    id integer NOT NULL,
    name text NOT NULL,
    parent_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_categories OWNER TO postgres;

--
-- Name: product_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_categories_id_seq OWNER TO postgres;

--
-- Name: product_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_categories_id_seq OWNED BY public.product_categories.id;


--
-- Name: product_folders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_folders (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_folders OWNER TO postgres;

--
-- Name: product_folders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_folders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_folders_id_seq OWNER TO postgres;

--
-- Name: product_folders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_folders_id_seq OWNED BY public.product_folders.id;


--
-- Name: product_inquiries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_inquiries (
    id integer NOT NULL,
    fb_user_id text NOT NULL,
    fb_user_name text,
    product_name text NOT NULL,
    product_id integer,
    inquired_at text NOT NULL,
    reminder_sent integer DEFAULT 0 NOT NULL,
    converted integer DEFAULT 0 NOT NULL,
    created_at text NOT NULL
);


ALTER TABLE public.product_inquiries OWNER TO postgres;

--
-- Name: product_inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_inquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_inquiries_id_seq OWNER TO postgres;

--
-- Name: product_inquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_inquiries_id_seq OWNED BY public.product_inquiries.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    original_price real,
    discount_price real,
    stock_quantity integer DEFAULT 0 NOT NULL,
    low_stock_threshold integer DEFAULT 5 NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    images text,
    main_image_index integer DEFAULT 0 NOT NULL,
    category text,
    brand text,
    item_type text,
    price_tier text,
    external_url text,
    folder_id integer,
    fb_image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: provider_usage_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_usage_log (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    success integer DEFAULT 0 NOT NULL,
    latency_ms integer DEFAULT 0 NOT NULL,
    error text,
    created_at text NOT NULL
);


ALTER TABLE public.provider_usage_log OWNER TO postgres;

--
-- Name: provider_usage_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.provider_usage_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.provider_usage_log_id_seq OWNER TO postgres;

--
-- Name: provider_usage_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.provider_usage_log_id_seq OWNED BY public.provider_usage_log.id;


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_plans (
    id integer NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    price_dzd real DEFAULT 0 NOT NULL,
    ai_conversations_limit integer DEFAULT 100 NOT NULL,
    products_limit integer DEFAULT 10 NOT NULL,
    providers_limit integer DEFAULT 1 NOT NULL,
    broadcast_limit integer DEFAULT 0 NOT NULL,
    appointments_enabled integer DEFAULT 0 NOT NULL,
    leads_enabled integer DEFAULT 0 NOT NULL,
    analytics_advanced integer DEFAULT 0 NOT NULL,
    multi_page integer DEFAULT 0 NOT NULL,
    is_active integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.subscription_plans OWNER TO postgres;

--
-- Name: subscription_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscription_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscription_plans_id_seq OWNER TO postgres;

--
-- Name: subscription_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscription_plans_id_seq OWNED BY public.subscription_plans.id;


--
-- Name: subscription_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_usage (
    id integer NOT NULL,
    month_year text NOT NULL,
    ai_conversations_used integer DEFAULT 0 NOT NULL,
    broadcast_sent integer DEFAULT 0 NOT NULL,
    messages_limit_warning_sent integer DEFAULT 0 NOT NULL,
    updated_at text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.subscription_usage OWNER TO postgres;

--
-- Name: subscription_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscription_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscription_usage_id_seq OWNER TO postgres;

--
-- Name: subscription_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscription_usage_id_seq OWNED BY public.subscription_usage.id;


--
-- Name: user_counters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_counters (
    fb_user_id text NOT NULL,
    off_topic_count integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_counters OWNER TO postgres;

--
-- Name: user_product_context; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_product_context (
    fb_user_id text NOT NULL,
    product_id integer NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_product_context OWNER TO postgres;

--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: ai_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_config ALTER COLUMN id SET DEFAULT nextval('public.ai_config_id_seq'::regclass);


--
-- Name: ai_providers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_providers ALTER COLUMN id SET DEFAULT nextval('public.ai_providers_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: available_slots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.available_slots ALTER COLUMN id SET DEFAULT nextval('public.available_slots_id_seq'::regclass);


--
-- Name: broadcast_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.broadcast_templates ALTER COLUMN id SET DEFAULT nextval('public.broadcast_templates_id_seq'::regclass);


--
-- Name: broadcasts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.broadcasts ALTER COLUMN id SET DEFAULT nextval('public.broadcasts_id_seq'::regclass);


--
-- Name: comments_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments_log ALTER COLUMN id SET DEFAULT nextval('public.comments_log_id_seq'::regclass);


--
-- Name: conversation_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_sessions ALTER COLUMN id SET DEFAULT nextval('public.conversation_sessions_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: delivery_prices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_prices ALTER COLUMN id SET DEFAULT nextval('public.delivery_prices_id_seq'::regclass);


--
-- Name: domain_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domain_templates ALTER COLUMN id SET DEFAULT nextval('public.domain_templates_id_seq'::regclass);


--
-- Name: faqs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs ALTER COLUMN id SET DEFAULT nextval('public.faqs_id_seq'::regclass);


--
-- Name: fb_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fb_settings ALTER COLUMN id SET DEFAULT nextval('public.fb_settings_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: order_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_sessions ALTER COLUMN id SET DEFAULT nextval('public.order_sessions_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: platform_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_events ALTER COLUMN id SET DEFAULT nextval('public.platform_events_id_seq'::regclass);


--
-- Name: pre_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_orders ALTER COLUMN id SET DEFAULT nextval('public.pre_orders_id_seq'::regclass);


--
-- Name: product_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN id SET DEFAULT nextval('public.product_categories_id_seq'::regclass);


--
-- Name: product_folders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_folders ALTER COLUMN id SET DEFAULT nextval('public.product_folders_id_seq'::regclass);


--
-- Name: product_inquiries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_inquiries ALTER COLUMN id SET DEFAULT nextval('public.product_inquiries_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: provider_usage_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_usage_log ALTER COLUMN id SET DEFAULT nextval('public.provider_usage_log_id_seq'::regclass);


--
-- Name: subscription_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans ALTER COLUMN id SET DEFAULT nextval('public.subscription_plans_id_seq'::regclass);


--
-- Name: subscription_usage id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_usage ALTER COLUMN id SET DEFAULT nextval('public.subscription_usage_id_seq'::regclass);


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_users (id, username, password_hash, created_at) FROM stdin;
1	admin	$2b$10$l2bG8jDPxfzfr8XYapi0GOJzmuTphgcDGp7ZXahQMq5BZtol88quq	2026-04-11 17:38:47.626103+00
\.


--
-- Data for Name: ai_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_config (id, bot_name, personality, greeting_message, language, respond_to_orders, reply_to_comments, send_dm_on_comment, active_provider_id, business_country, business_city, business_domain, business_domain_custom, target_audience, business_hours_start, business_hours_end, timezone, outside_hours_message, currency, page_name, page_description, page_logo_url, page_facebook_url, strict_topic_mode, off_topic_response, blocked_keywords, max_off_topic_messages, handoff_keyword, handoff_message, current_plan, lead_capture_enabled, lead_capture_fields, lead_capture_message, use_quick_replies, quick_reply_buttons, working_hours_enabled, abandoned_cart_enabled, abandoned_cart_delay_hours, abandoned_cart_message, bot_enabled, bot_disabled_message, confidence_threshold, confidence_below_action, safe_mode_enabled, safe_mode_level, customer_memory_enabled, sales_boost_enabled, sales_boost_level, price_lock_enabled, human_guarantee_enabled, smart_escalation_enabled, delivery_enabled, appointments_enabled, updated_at) FROM stdin;
1	مساعد المتجر	أنا مساعد ذكي ومفيد لخدمة عملاء المتجر. أتحدث بلغة ودية واحترافية.	مرحباً! كيف يمكنني مساعدتك اليوم؟ 😊	auto	1	1	1	\N	Algeria		general	\N	all	09:00	22:00	Africa/Algiers	مرحباً! نحن حالياً خارج ساعات العمل (9:00 - 22:00). يرجى التواصل معنا خلال ساعات العمل.	DZD	\N	\N	\N	\N	0	\N	\N	3	بشري	تم تحويلك إلى فريق الدعم البشري. سيتواصل معك أحد ممثلينا قريباً.	free	0	["phone"]	يسعدنا خدمتك! هل يمكنك مشاركتنا رقم هاتفك للتواصل؟	1	\N	1	1	1	مرحباً! 👋 لاحظنا اهتمامك بـ {product_name}\nهل تريد إتمام طلبك؟ نحن هنا لمساعدتك 😊	1	عذراً، المساعد الذكي غير متاح حالياً. يرجى التواصل معنا لاحقاً.	0.5	none	0	standard	0	0	medium	0	0	0	0	0	2026-04-11 17:38:47.631+00
\.


--
-- Data for Name: ai_providers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_providers (id, name, provider_type, api_key, base_url, model_name, is_active, priority, is_enabled, fail_count, last_used_at, created_at) FROM stdin;
1	Anthropic	anthropic		https://api.anthropic.com	claude-haiku-4-5	0	0	1	0	\N	2026-04-11 17:38:47.636828+00
2	OpenAI	openai		https://api.openai.com	gpt-4o-mini	0	0	1	0	\N	2026-04-11 17:38:47.636828+00
3	DeepSeek	deepseek		https://api.deepseek.com	deepseek-chat	0	0	1	0	\N	2026-04-11 17:38:47.636828+00
4	Groq	groq		https://api.groq.com/openai	llama-3.3-70b-versatile	0	0	1	0	\N	2026-04-11 17:38:47.636828+00
5	OpenRouter	openrouter		https://openrouter.ai/api	openai/gpt-4o-mini	0	0	1	0	\N	2026-04-11 17:38:47.636828+00
6	Orbit	orbit		https://api.orbit-provider.com/api/provider/agy	claude-sonnet-4-6	0	0	1	0	\N	2026-04-11 17:38:47.636828+00
7	AgentRouter	agentrouter		https://agentrouter.org	claude-sonnet-4-5-20250514	0	0	1	0	\N	2026-04-11 17:38:47.636828+00
8	Google Gemini	gemini		https://generativelanguage.googleapis.com/v1beta/openai	gemini-2.0-flash	0	0	1	0	\N	2026-04-11 17:38:47.636828+00
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, fb_user_id, fb_user_name, fb_profile_url, service_name, appointment_date, time_slot, status, note, source, created_at) FROM stdin;
\.


--
-- Data for Name: available_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.available_slots (id, day_of_week, time_slot, is_active, max_bookings) FROM stdin;
1	1	09:00	1	1
2	1	11:00	1	1
3	1	14:00	1	1
4	1	16:00	1	1
5	2	09:00	1	1
6	2	11:00	1	1
7	2	14:00	1	1
8	2	16:00	1	1
9	3	09:00	1	1
10	3	11:00	1	1
11	3	14:00	1	1
12	3	16:00	1	1
13	4	09:00	1	1
14	4	11:00	1	1
15	4	14:00	1	1
16	4	16:00	1	1
17	5	09:00	1	1
18	5	11:00	1	1
19	5	14:00	1	1
20	5	16:00	1	1
\.


--
-- Data for Name: broadcast_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.broadcast_templates (id, name, category, message_text, created_at) FROM stdin;
1	عرض خاص	offers	🎉 عرض خاص لفترة محدودة!\n{product_name} بسعر {price} دج فقط\nاطلب الآن قبل نفاد الكمية! ⏳\n{page_name}	2026-04-11T17:38:47.540Z
2	عيد الفطر	holidays	كل عام وأنتم بخير بمناسبة عيد الفطر المبارك 🌙\nنتمنى لكم عيداً سعيداً مع أهلكم وأحبائكم ❤️\n— {page_name}	2026-04-11T17:38:47.540Z
3	عيد الأضحى	holidays	عيد أضحى مبارك وكل عام وأنتم بخير 🐑\n{page_name} يتمنى لكم عيداً سعيداً مباركاً 😊	2026-04-11T17:38:47.540Z
4	إعادة استهداف	retargeting	مرحباً! 👋 لم نرك منذ فترة\nلدينا منتجات جديدة قد تعجبك 😊\nتفضل بزيارتنا وسنسعد بخدمتك\n— {page_name}	2026-04-11T17:38:47.540Z
5	ترحيب بعميل جديد	welcome	🎉 مرحباً بك في {page_name}!\nيسعدنا خدمتك في أي وقت.\nلا تتردد في السؤال عن أي شيء 😊	2026-04-11T17:38:47.540Z
6	تخفيض موسمي	offers	🔥 تخفيضات موسمية الآن!\nوفر على مشترياتك اليوم فقط\nتواصل معنا لمعرفة العروض 📲\n— {page_name}	2026-04-11T17:38:47.540Z
\.


--
-- Data for Name: broadcasts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.broadcasts (id, title, message_text, image_url, target_filter, target_label, status, sent_count, total_recipients, scheduled_at, sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: comments_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments_log (id, post_id, comment_id, fb_user_id, fb_user_name, fb_profile_url, comment_text, ai_reply, dm_sent, "timestamp") FROM stdin;
\.


--
-- Data for Name: conversation_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversation_sessions (id, fb_user_id, session_start, session_end, message_count, ai_calls_count, status, created_at) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, fb_user_id, fb_user_name, fb_profile_url, message, sender, "timestamp", is_paused, sentiment, label, confidence_score, rescue_triggered, safe_mode_blocked, provider_name, model_name, source_type, sales_trigger_type, converted_to_order, conversion_source, conversion_value, operator_note) FROM stdin;
\.


--
-- Data for Name: delivery_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_prices (id, wilaya_id, wilaya_name, home_price, office_price) FROM stdin;
\.


--
-- Data for Name: domain_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.domain_templates (id, domain, template_name, bot_name, personality, greeting_message, sample_faqs, sample_products) FROM stdin;
1	phones	متجر الهواتف والإكسسوارات	مساعد موبايل برو	أنا مساعد متخصص في الهواتف الذكية والإكسسوارات. أقدم معلومات دقيقة عن المواصفات والأسعار وأساعد العملاء في اختيار الهاتف المناسب لاحتياجاتهم وميزانيتهم. أتحدث بلغة تقنية مبسطة وودية، وأهتم بتقديم أفضل العروض المتاحة.	مرحباً بك في متجر الهواتف! 📱 هل تبحث عن هاتف جديد أو إكسسوار معين؟ أنا هنا لمساعدتك في اختيار أفضل ما يناسبك.	[{"question":"هل تبيعون هواتف أصلية مضمونة؟","answer":"نعم، جميع هواتفنا أصلية 100% مع ضمان المصنع لمدة سنة كاملة."},{"question":"هل يوجد خدمة استبدال الهاتف القديم؟","answer":"نعم، نقبل استبدال هاتفك القديم بخصم على شراء هاتف جديد. أرسل لنا صور الهاتف لتقييمه."},{"question":"ما هي طرق الدفع المتاحة؟","answer":"نقبل الدفع نقداً، بطاقة بريدية CIB، أو تحويل بنكي. يمكن الدفع بالتقسيط أيضاً."}]	[{"name":"Samsung Galaxy A55","price":89000,"description":"هاتف سامسونج A55 - شاشة AMOLED 6.6 بوصة، كاميرا 50MP، بطارية 5000mAh"},{"name":"iPhone 14 - 128GB","price":145000,"description":"أيفون 14 أصلي مضمون - شاشة Super Retina XDR، كاميرا 12MP، شريحة A15 Bionic"}]
2	restaurant	المطعم والمأكولات	مساعد المطعم	أنا مساعد مطعمنا الودود والمحبوب! أساعدك في الاطلاع على قائمة الطعام، معرفة المكونات والأسعار، وإتمام طلبك بسهولة. أهتم بتجربتك وأسعى لتقديم أفضل خدمة. أتحدث بحماس عن أكلاتنا اللذيذة المحضرة بمكونات طازجة يومياً.	أهلاً وسهلاً! 🍽️ مرحباً بك في مطعمنا. هل تريد الاطلاع على قائمة الطعام أو تقديم طلب الآن؟ يسعدنا خدمتك!	[{"question":"هل تتوفر خدمة التوصيل؟","answer":"نعم! نوصل لجميع أحياء المدينة. رسوم التوصيل 200 دج، ومجاني للطلبات فوق 1500 دج."},{"question":"هل يمكن تخصيص الطلب حسب الحمية الغذائية؟","answer":"بالتأكيد! يمكننا تحضير وجباتك بدون ملح زائد، أو بدون غلوتين، أو نباتية. فقط أخبرنا باحتياجاتك."},{"question":"ما هو وقت التسليم؟","answer":"نسلم خلال 30-45 دقيقة داخل المدينة. وقت التحضير 20 دقيقة لمعظم الأطباق."}]	[{"name":"برغر كلاسيك مع بطاطس","price":850,"description":"برغر لحم طازج 200غ مع خس، طماطم، جبن، صلصة منزلية + بطاطس مقلية"},{"name":"بيتزا مارغريتا 30cm","price":1200,"description":"بيتزا إيطالية بعجينة طازجة، صلصة طماطم، جبن موزاريلا وريحان طازج"}]
3	salon	صالون التجميل	مساعد الصالون	أنا مساعد صالون التجميل المتخصص والأنيق. أساعدك في الاستفسار عن خدماتنا، الأسعار، ومواعيد الحجز. أتحدث بلغة لطيفة وأنيقة تعكس أسلوب صالوننا الراقي. أهتم بتقديم نصائح الجمال المناسبة وأساعدك في اختيار الخدمة الأنسب لك.	مرحباً بك في صالون التجميل ✨ هل تودين حجز موعد أو الاستفسار عن خدماتنا؟ أنا هنا لمساعدتك!	[{"question":"هل يمكن الحجز مسبقاً؟","answer":"نعم، ننصح بالحجز المسبق لضمان حصولك على الموعد المناسب. يمكنك الحجز عبر الرسائل أو الاتصال بنا."},{"question":"هل تستخدمون منتجات عالمية؟","answer":"نعم، نستخدم منتجات عالمية مرخصة مثل L'Oréal وKeratin Complex للحصول على أفضل النتائج."},{"question":"ما هي مدة جلسة الكيراتين؟","answer":"جلسة الكيراتين تستغرق من 2 إلى 3 ساعات حسب طول الشعر وكثافته."}]	[{"name":"جلسة كيراتين برازيلي","price":4500,"description":"علاج الكيراتين البرازيلي الأصلي لتنعيم وترطيب الشعر لمدة 3-6 أشهر"},{"name":"صبغة شعر كاملة","price":2800,"description":"صبغة شعر احترافية بمنتجات L'Oréal، تشمل الغسيل والتجفيف والتصفيف"}]
4	medical	العيادة والخدمات الطبية	مساعد العيادة	أنا مساعد العيادة الطبية المتخصص والمحترف. أساعدك في حجز المواعيد، الاستفسار عن الخدمات الطبية والأسعار، وتقديم معلومات عامة مفيدة. أتحدث باحترافية ودقة مع الحرص على الخصوصية التامة. لا أقدم تشخيصات طبية، وأنصح دائماً بزيارة الطبيب للاستشارة المتخصصة.	مرحباً بك في عيادتنا 🏥 يسعدنا خدمتك. هل تريد حجز موعد أو الاستفسار عن خدماتنا الطبية؟	[{"question":"هل يمكن حجز موعد عاجل؟","answer":"نعم، لدينا مواعيد عاجلة متاحة يومياً. يرجى التواصل معنا مباشرة لمعرفة الأوقات المتاحة."},{"question":"هل تقبلون التأمين الصحي؟","answer":"نعم، نتعامل مع معظم شركات التأمين الصحي. يرجى إحضار بطاقة التأمين عند زيارتك."},{"question":"ما هي وثائق التحضير للفحص؟","answer":"يرجى إحضار بطاقة الهوية الوطنية، ونتائج الفحوصات السابقة إن وجدت."}]	[{"name":"استشارة طبية عامة","price":1500,"description":"فحص طبي شامل مع استشارة الطبيب العام وتقرير طبي مفصل"},{"name":"تحاليل دم شاملة","price":2500,"description":"مجموعة تحاليل دم شاملة تشمل CBC، السكر، الكوليسترول، وظائف الكبد والكلى"}]
5	fashion	متجر الأزياء والملابس	مساعد الموضة	أنا مساعد متجر الأزياء العصري والأنيق! أشاركك أحدث صيحات الموضة، أساعدك في اختيار الملابس المناسبة لكل مناسبة، وأقدم لك عروض وخصومات حصرية. أتحدث بلغة عصرية وأنيقة، وأهتم بتقديم تجربة تسوق ممتعة ومميزة.	مرحباً بك في عالم الموضة! 👗✨ اكتشف أحدث تشكيلاتنا وعروضنا الحصرية. كيف يمكنني مساعدتك اليوم؟	[{"question":"هل يمكن الاستبدال أو الإرجاع؟","answer":"نعم، يمكن الاستبدال خلال 7 أيام من تاريخ الشراء مع الحفاظ على القطعة بحالتها الأصلية ووسومها."},{"question":"هل تتوفر مقاسات كبيرة Plus Size؟","answer":"نعم، لدينا تشكيلة واسعة من المقاسات من S حتى 4XL لجميع القطع."},{"question":"هل يوجد توصيل للمنزل؟","answer":"نعم، نوصل لجميع ولايات الجزائر خلال 2-5 أيام عمل. التوصيل مجاني فوق 5000 دج."}]	[{"name":"فستان سهرة أنيق","price":7500,"description":"فستان سهرة راقي بقماش الساتان، متوفر بألوان متعددة، مقاسات S-3XL"},{"name":"بدلة رسمية رجالية","price":12000,"description":"بدلة رسمية كلاسيكية بقماش عالي الجودة، تشمل جاكيت وبنطلون وقميص"}]
6	real_estate	العقارات والإيجارات	مساعد العقارات	أنا مساعد وكالة العقارات المتخصص والموثوق. أساعدك في البحث عن العقار المناسب للشراء أو الإيجار، أقدم معلومات تفصيلية عن المواقع والأسعار، وأنسق مواعيد المعاينة. أتحدث باحترافية وشفافية تامة، وأسعى لإيجاد أفضل صفقة تناسب احتياجاتك وميزانيتك.	مرحباً بك في وكالة العقارات! 🏠 هل تبحث عن شراء أو إيجار عقار؟ أخبرني باحتياجاتك وسأساعدك في إيجاد أفضل الخيارات المتاحة.	[{"question":"هل يمكن رؤية العقار قبل التعاقد؟","answer":"بالطبع! نرتب مواعيد معاينة مجانية لجميع عقاراتنا. تواصل معنا لتحديد الموعد المناسب."},{"question":"ما هي الوثائق المطلوبة للشراء؟","answer":"تحتاج: بطاقة الهوية، كشف حساب بنكي 3 أشهر، شهادة العمل، وعقد البيع يحرره موثق معتمد."},{"question":"هل تقدمون خدمة إدارة العقارات؟","answer":"نعم، نقدم خدمة إدارة العقارات المؤجرة شاملة: إيجاد المستأجرين، جمع الإيجارات، وصيانة العقار."}]	[{"name":"شقة F3 - حيدرة الجزائر","price":12500000,"description":"شقة F3 في حيدرة، 85م², الطابق 3، مطلة على حديقة، قريبة من المواصلات"},{"name":"فيلا دوبلكس - تيبازة","price":28000000,"description":"فيلا دوبلكس 200م²، 4 غرف، حديقة 150م², كراج، قريبة من البحر"}]
\.


--
-- Data for Name: faqs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faqs (id, question, answer, category, is_active, created_at) FROM stdin;
1	ما هي ساعات العمل؟	نعمل من الساعة 9:00 صباحاً حتى 10:00 مساءً من السبت إلى الخميس.	عام	1	2026-04-11 17:38:47.648689+00
2	كيف يمكنني تقديم طلب؟	يمكنك إرسال رسالة لنا عبر الصفحة وسيقوم المساعد الذكي بمساعدتك في إتمام طلبك.	طلبات	1	2026-04-11 17:38:47.648689+00
3	هل يوجد توصيل؟	نعم، نوفر خدمة التوصيل. تختلف رسوم التوصيل حسب الموقع. راسلنا لمزيد من التفاصيل.	توصيل	1	2026-04-11 17:38:47.648689+00
\.


--
-- Data for Name: fb_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fb_settings (id, page_access_token, verify_token, page_id, app_secret, updated_at) FROM stdin;
1	\N	\N	\N	\N	\N
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, fb_user_id, fb_user_name, fb_profile_url, phone, email, label, notes, source, last_interaction_at, total_messages, created_at, updated_at) FROM stdin;
1	sample_lead_001	أحمد بن علي	https://facebook.com/sample1	0551234567	ahmed@example.com	customer	عميل منتظم، يطلب أسبوعياً	messenger	2026-04-11T17:38:47.540Z	12	2026-04-11 17:38:47.670108+00	2026-04-11 17:38:47.670108+00
2	sample_lead_002	فاطمة بوزيد	https://facebook.com/sample2	0661234567	\N	interested	مهتمة بالمنتجات، تحتاج متابعة	messenger	2026-04-11T17:38:47.540Z	4	2026-04-11 17:38:47.670108+00	2026-04-11 17:38:47.670108+00
3	sample_lead_003	يوسف خالد	https://facebook.com/sample3	\N	youssef@example.com	new		comment	2026-04-11T17:38:47.540Z	1	2026-04-11 17:38:47.670108+00	2026-04-11 17:38:47.670108+00
\.


--
-- Data for Name: order_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_sessions (id, fb_user_id, product_name, product_id, quantity, customer_name, customer_phone, customer_wilaya, customer_commune, customer_address, delivery_type, delivery_price, step, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, fb_user_id, fb_user_name, fb_profile_url, product_id, product_name, unit_price, quantity, total_price, status, note, customer_name, customer_phone, customer_wilaya, customer_commune, customer_address, delivery_type, delivery_price, source, created_at) FROM stdin;
\.


--
-- Data for Name: platform_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_events (id, event_type, fb_user_id, detail, created_at) FROM stdin;
\.


--
-- Data for Name: pre_order_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pre_order_sessions (fb_user_id, product_id, product_name, step, customer_name, created_at) FROM stdin;
\.


--
-- Data for Name: pre_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pre_orders (id, fb_user_id, fb_user_name, product_id, product_name, customer_name, phone, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: processed_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.processed_messages (mid, sender_id, processed_at) FROM stdin;
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_categories (id, name, parent_id, created_at) FROM stdin;
\.


--
-- Data for Name: product_folders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_folders (id, name, created_at) FROM stdin;
\.


--
-- Data for Name: product_inquiries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_inquiries (id, fb_user_id, fb_user_name, product_name, product_id, inquired_at, reminder_sent, converted, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, description, original_price, discount_price, stock_quantity, low_stock_threshold, status, images, main_image_index, category, brand, item_type, price_tier, external_url, folder_id, fb_image_url, created_at) FROM stdin;
1	منتج تجريبي / Test Product	هذا منتج تجريبي للعرض. يمكنك تعديله أو حذفه وإضافة منتجاتك الخاصة.	1000	850	10	3	available	["/public/uploads/placeholder.jpg"]	0	\N	\N	\N	\N	\N	\N	\N	2026-04-11 17:38:47.640421+00
\.


--
-- Data for Name: provider_usage_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provider_usage_log (id, provider_id, success, latency_ms, error, created_at) FROM stdin;
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_plans (id, name, display_name, price_dzd, ai_conversations_limit, products_limit, providers_limit, broadcast_limit, appointments_enabled, leads_enabled, analytics_advanced, multi_page, is_active) FROM stdin;
1	free	المجانية / Free	0	30	10	1	0	0	0	0	0	1
2	starter	المبتدئة / Starter	2900	300	50	3	500	1	1	0	0	1
3	pro	الاحترافية / Pro	6900	1000	-1	6	-1	1	1	1	0	1
4	agency	الوكالات / Agency	14900	-1	-1	6	-1	1	1	1	1	1
\.


--
-- Data for Name: subscription_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_usage (id, month_year, ai_conversations_used, broadcast_sent, messages_limit_warning_sent, updated_at) FROM stdin;
1	2026-04	0	0	0	2026-04-11T17:38:47.660Z
\.


--
-- Data for Name: user_counters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_counters (fb_user_id, off_topic_count, updated_at) FROM stdin;
\.


--
-- Data for Name: user_product_context; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_product_context (fb_user_id, product_id, updated_at) FROM stdin;
\.


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 1, true);


--
-- Name: ai_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_config_id_seq', 1, true);


--
-- Name: ai_providers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_providers_id_seq', 8, true);


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_id_seq', 1, false);


--
-- Name: available_slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.available_slots_id_seq', 20, true);


--
-- Name: broadcast_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.broadcast_templates_id_seq', 6, true);


--
-- Name: broadcasts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.broadcasts_id_seq', 1, false);


--
-- Name: comments_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_log_id_seq', 1, false);


--
-- Name: conversation_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversation_sessions_id_seq', 1, false);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversations_id_seq', 1, false);


--
-- Name: delivery_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_prices_id_seq', 1, false);


--
-- Name: domain_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.domain_templates_id_seq', 6, true);


--
-- Name: faqs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faqs_id_seq', 3, true);


--
-- Name: fb_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fb_settings_id_seq', 1, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leads_id_seq', 3, true);


--
-- Name: order_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_sessions_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: platform_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.platform_events_id_seq', 1, false);


--
-- Name: pre_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pre_orders_id_seq', 1, false);


--
-- Name: product_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_categories_id_seq', 1, false);


--
-- Name: product_folders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_folders_id_seq', 1, false);


--
-- Name: product_inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_inquiries_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 1, true);


--
-- Name: provider_usage_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provider_usage_log_id_seq', 1, false);


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscription_plans_id_seq', 4, true);


--
-- Name: subscription_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscription_usage_id_seq', 1, true);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_unique UNIQUE (username);


--
-- Name: ai_config ai_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_config
    ADD CONSTRAINT ai_config_pkey PRIMARY KEY (id);


--
-- Name: ai_providers ai_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_providers
    ADD CONSTRAINT ai_providers_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: available_slots available_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.available_slots
    ADD CONSTRAINT available_slots_pkey PRIMARY KEY (id);


--
-- Name: broadcast_templates broadcast_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.broadcast_templates
    ADD CONSTRAINT broadcast_templates_pkey PRIMARY KEY (id);


--
-- Name: broadcasts broadcasts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.broadcasts
    ADD CONSTRAINT broadcasts_pkey PRIMARY KEY (id);


--
-- Name: comments_log comments_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments_log
    ADD CONSTRAINT comments_log_pkey PRIMARY KEY (id);


--
-- Name: conversation_sessions conversation_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_sessions
    ADD CONSTRAINT conversation_sessions_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: delivery_prices delivery_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_prices
    ADD CONSTRAINT delivery_prices_pkey PRIMARY KEY (id);


--
-- Name: delivery_prices delivery_prices_wilaya_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_prices
    ADD CONSTRAINT delivery_prices_wilaya_id_unique UNIQUE (wilaya_id);


--
-- Name: domain_templates domain_templates_domain_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domain_templates
    ADD CONSTRAINT domain_templates_domain_unique UNIQUE (domain);


--
-- Name: domain_templates domain_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domain_templates
    ADD CONSTRAINT domain_templates_pkey PRIMARY KEY (id);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: fb_settings fb_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fb_settings
    ADD CONSTRAINT fb_settings_pkey PRIMARY KEY (id);


--
-- Name: leads leads_fb_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_fb_user_id_unique UNIQUE (fb_user_id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: order_sessions order_sessions_fb_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_sessions
    ADD CONSTRAINT order_sessions_fb_user_id_unique UNIQUE (fb_user_id);


--
-- Name: order_sessions order_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_sessions
    ADD CONSTRAINT order_sessions_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: platform_events platform_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_events
    ADD CONSTRAINT platform_events_pkey PRIMARY KEY (id);


--
-- Name: pre_order_sessions pre_order_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_order_sessions
    ADD CONSTRAINT pre_order_sessions_pkey PRIMARY KEY (fb_user_id);


--
-- Name: pre_orders pre_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_orders
    ADD CONSTRAINT pre_orders_pkey PRIMARY KEY (id);


--
-- Name: processed_messages processed_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processed_messages
    ADD CONSTRAINT processed_messages_pkey PRIMARY KEY (mid);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_folders product_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_folders
    ADD CONSTRAINT product_folders_pkey PRIMARY KEY (id);


--
-- Name: product_inquiries product_inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_inquiries
    ADD CONSTRAINT product_inquiries_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: provider_usage_log provider_usage_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_usage_log
    ADD CONSTRAINT provider_usage_log_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_name_unique UNIQUE (name);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_usage subscription_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_usage
    ADD CONSTRAINT subscription_usage_pkey PRIMARY KEY (id);


--
-- Name: user_counters user_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_counters
    ADD CONSTRAINT user_counters_pkey PRIMARY KEY (fb_user_id);


--
-- Name: user_product_context user_product_context_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_product_context
    ADD CONSTRAINT user_product_context_pkey PRIMARY KEY (fb_user_id);


--
-- Name: conversations_fb_user_id_sender_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_fb_user_id_sender_idx ON public.conversations USING btree (fb_user_id, sender);


--
-- Name: conversations_fb_user_id_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_fb_user_id_timestamp_idx ON public.conversations USING btree (fb_user_id, "timestamp");


--
-- Name: platform_events_fb_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX platform_events_fb_user_id_idx ON public.platform_events USING btree (fb_user_id);


--
-- Name: order_sessions order_sessions_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_sessions
    ADD CONSTRAINT order_sessions_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: orders orders_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: pre_order_sessions pre_order_sessions_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_order_sessions
    ADD CONSTRAINT pre_order_sessions_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: pre_orders pre_orders_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_orders
    ADD CONSTRAINT pre_orders_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: product_inquiries product_inquiries_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_inquiries
    ADD CONSTRAINT product_inquiries_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: provider_usage_log provider_usage_log_provider_id_ai_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_usage_log
    ADD CONSTRAINT provider_usage_log_provider_id_ai_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.ai_providers(id) ON DELETE CASCADE;


--
-- Name: user_product_context user_product_context_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_product_context
    ADD CONSTRAINT user_product_context_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict AkVl8JJFCWHxEmV43DAijiE8w8IAvI0QJ7lTjA8LhrfsRzck2x2fWMKBbPU7RwW

