#!/usr/bin/env bash
docker exec umssy-db psql -U user -d app_db -c "
SELECT u.email, u.first_name, u.last_name, u.is_active, r.name as role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.created_at DESC;
"
