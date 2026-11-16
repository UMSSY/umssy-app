#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -n "$(git status --porcelain)" ]; then
  echo "El árbol de trabajo tiene cambios. Haz commit o stash y vuelve a correr el script." >&2
  exit 1
fi

if ! grep -q "findActiveRecruitersByCompany" backend/src/modules/users/services/users.service.ts; then
  echo "Primero aplica el parche 01 (correcciones del review de #2171) y recién después corre este script." >&2
  exit 1
fi

CONFLICTOS_ESPERADOS="backend/src/modules/applications/repositories/applications.repository.ts
backend/src/modules/applications/services/applications.service.ts
backend/src/modules/notifications/services/push-dispatcher.service.ts
backend/src/modules/notifications/tests/push-dispatcher.service.spec.ts
backend/src/prisma/internal/class.ts
frontend/src/modules/profile/index.ts
frontend/src/modules/skills/hooks/use-skills.test.ts
frontend/src/modules/skills/hooks/use-skills.ts
frontend/src/modules/skills/index.ts
frontend/src/modules/work-experience/hooks/use-save-work-experience.test.ts
frontend/src/modules/work-experience/hooks/use-save-work-experience.ts"

TOMAR_DEVELOP=(
  backend/src/prisma/internal/class.ts
  backend/src/modules/notifications/services/push-dispatcher.service.ts
  backend/src/modules/notifications/tests/push-dispatcher.service.spec.ts
  frontend/src/modules/profile/index.ts
  frontend/src/modules/skills/index.ts
)

TOMAR_EPIC_Y_PARCHAR=(
  backend/src/modules/applications/repositories/applications.repository.ts
  backend/src/modules/applications/services/applications.service.ts
  frontend/src/modules/skills/hooks/use-skills.ts
  frontend/src/modules/skills/hooks/use-skills.test.ts
  frontend/src/modules/work-experience/hooks/use-save-work-experience.ts
  frontend/src/modules/work-experience/hooks/use-save-work-experience.test.ts
)

git fetch origin develop
git merge --no-commit --no-ff origin/develop >/dev/null 2>&1 || true

ACTUALES="$(git diff --name-only --diff-filter=U | sort)"
if [ "$ACTUALES" != "$CONFLICTOS_ESPERADOS" ]; then
  git merge --abort
  echo "El conjunto de conflictos no es el esperado (la rama epic cambió desde que se generó este script)." >&2
  echo "Se abortó el merge sin tocar nada. Conflictos encontrados:" >&2
  echo "$ACTUALES" >&2
  exit 2
fi

git checkout --theirs -- "${TOMAR_DEVELOP[@]}"
git checkout --ours -- "${TOMAR_EPIC_Y_PARCHAR[@]}"
git add -A

if ! git apply --index --3way "$AQUI/resolucion-develop.patch"; then
  echo "El parche de resolución no aplicó limpio. El merge sigue abierto: revisa 'git status'." >&2
  exit 3
fi

if git diff --name-only --diff-filter=U | grep -q .; then
  echo "Quedaron archivos sin resolver. El merge sigue abierto: revisa 'git status'." >&2
  exit 3
fi

git commit -q -m "merge: resolve conflicts with develop branch"

echo "Merge con develop resuelto y commiteado:"
git log --oneline -1
