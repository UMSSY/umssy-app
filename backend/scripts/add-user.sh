#!/usr/bin/env bash
EMAIL="${1}"
FIRST_NAME="${2:-Usuario}"
LAST_NAME="${3:-Prueba}"
ROLE="${4:-estudiante}"

if [ -z "$EMAIL" ]; then
  echo "Uso: ./scripts/add-user.sh <correo> [nombre] [apellido] [rol]"
  echo "Ejemplo: ./scripts/add-user.sh nuevo@gmail.com Juan Perez estudiante"
  exit 1
fi

docker exec umssy-db psql -U user -d app_db -c "
DO \$\$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_role_id uuid;
BEGIN
  SELECT id INTO v_role_id FROM roles WHERE name = '$ROLE' LIMIT 1;
  IF v_role_id IS NULL THEN
    INSERT INTO roles (id, name, created_at, updated_at) VALUES (gen_random_uuid(), '$ROLE', NOW(), NOW()) RETURNING id INTO v_role_id;
  END IF;

  INSERT INTO users (id, first_name, last_name, email, password, is_active, is_available_for_mentoring, created_at, updated_at)
  VALUES (v_user_id, '$FIRST_NAME', '$LAST_NAME', '$EMAIL', '\$2b\$10\$gP5SnV354sPDyidE0LmmPuOAuurKpCh8mEfocnh0ZOG6UKp9hLoGO', true, false, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE 
  SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, is_active = true, updated_at = NOW()
  RETURNING id INTO v_user_id;

  INSERT INTO user_roles (id, user_id, role_id, start_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_user_id, v_role_id, NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;
END \$\$;
" > /dev/null

echo "Usuario $EMAIL registrado/actualizado con éxito (Rol: $ROLE, Contraseña inicial: Prueba123)."
