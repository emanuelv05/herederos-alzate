-- ============================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS (Maestro-Detalle)
-- ADVERTENCIA: Este script ELIMINARÁ las tablas de inventario actuales
-- y las recreará. Asegúrate de hacer un respaldo si tienes datos.
-- ============================================================

-- 1. Eliminar dependencias
DROP TABLE IF EXISTS firma_factura CASCADE;
DROP TABLE IF EXISTS movimiento CASCADE;
DROP TABLE IF EXISTS variante_calzado CASCADE;
DROP TABLE IF EXISTS modelo_calzado CASCADE;
DROP TABLE IF EXISTS calzado CASCADE;

-- 2. Crear Tabla Maestra: Modelo Calzado
CREATE TABLE modelo_calzado (
    id_modelo       SERIAL       NOT NULL,
    codigo          VARCHAR(20)  NOT NULL,
    nombre_modelo   VARCHAR(150) NOT NULL,
    fecha_registro  DATE         NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    id_categoria    INT          NOT NULL,
    CONSTRAINT pk_modelo PRIMARY KEY (id_modelo),
    CONSTRAINT uq_modelo_codigo UNIQUE (codigo),
    CONSTRAINT fk_modelo_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria) ON DELETE RESTRICT
);

-- 3. Crear Tabla Detalle: Variante Calzado
CREATE TABLE variante_calzado (
    id_variante     SERIAL       NOT NULL,
    id_modelo       INT          NOT NULL,
    id_proveedor    INT          NOT NULL,
    talla           VARCHAR(10)  NOT NULL,
    color           VARCHAR(50)  NOT NULL,
    stock_actual    INT          NOT NULL DEFAULT 0,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_variante PRIMARY KEY (id_variante),
    CONSTRAINT fk_variante_modelo FOREIGN KEY (id_modelo) REFERENCES modelo_calzado(id_modelo) ON DELETE RESTRICT,
    CONSTRAINT fk_variante_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor) ON DELETE RESTRICT,
    CONSTRAINT ck_stock_actual CHECK (stock_actual >= 0)
);

-- 4. Recrear Tabla Movimiento (Apuntando a variante_calzado)
CREATE TABLE movimiento (
    id_movimiento     SERIAL       NOT NULL,
    cantidad          INT          NOT NULL,
    fecha_movimiento  DATE         NOT NULL,
    descripcion       VARCHAR(255),
    id_variante       INT          NOT NULL,
    id_tipomovimiento INT          NOT NULL,
    id_usuario        INT          NOT NULL,
    CONSTRAINT pk_movimiento PRIMARY KEY (id_movimiento),
    CONSTRAINT fk_mov_variante FOREIGN KEY (id_variante) REFERENCES variante_calzado(id_variante) ON DELETE RESTRICT,
    CONSTRAINT fk_mov_tipo FOREIGN KEY (id_tipomovimiento) REFERENCES tipo_movimiento(id_tipomovimiento) ON DELETE RESTRICT,
    CONSTRAINT fk_mov_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT ck_mov_cantidad CHECK (cantidad > 0)
);

-- 5. Recrear Tabla Firma Factura
CREATE TABLE firma_factura (
    id_firma      SERIAL       NOT NULL,
    id_movimiento INT          NOT NULL,
    tipo_firma    VARCHAR(20)  NOT NULL,
    firma_base64  TEXT,
    nombre_firma  VARCHAR(255),
    fecha_firma   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_firma_factura PRIMARY KEY (id_firma),
    CONSTRAINT fk_firma_movimiento FOREIGN KEY (id_movimiento) REFERENCES movimiento(id_movimiento) ON DELETE CASCADE,
    CONSTRAINT uq_firma_movimiento UNIQUE (id_movimiento)
);

-- 6. Recrear Índices
CREATE INDEX idx_modelo_categoria ON modelo_calzado(id_categoria);
CREATE INDEX idx_modelo_codigo    ON modelo_calzado(codigo);

CREATE INDEX idx_variante_modelo  ON variante_calzado(id_modelo);
CREATE INDEX idx_variante_proveedor ON variante_calzado(id_proveedor);
CREATE UNIQUE INDEX uq_variante_activa ON variante_calzado (id_modelo, talla, color, id_proveedor) WHERE activo = true;

CREATE INDEX idx_mov_variante     ON movimiento(id_variante);
CREATE INDEX idx_mov_usuario      ON movimiento(id_usuario);
CREATE INDEX idx_mov_tipo         ON movimiento(id_tipomovimiento);
CREATE INDEX idx_mov_fecha        ON movimiento(fecha_movimiento);
CREATE INDEX idx_firma_mov        ON firma_factura(id_movimiento);
