#!/usr/bin/env bash
branch="$1"

GROUP='^(feature|fix|hotfix|refactor|docs|test)/grupo-[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$'
DEVOPS='^(chore|ci|feature|fix|hotfix|refactor|docs|test)/devops-[a-z0-9]+(-[a-z0-9]+)*$'
EPIC='^epic/grupo-?[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$'

if [[ "$branch" == "develop" || "$branch" == "main" \
   || "$branch" =~ $GROUP || "$branch" =~ $DEVOPS || "$branch" =~ $EPIC ]]; then
  exit 0
fi

echo "Wrong Name branch : $branch" >&2
echo "Grupos: <tipo>/grupo-<n>-<descripcion> (ej: feature/grupo-1-login)" >&2
echo "DevOps: <tipo>/devops-<descripcion> (chore y ci son solo de DevOps)" >&2
echo "Épicas: epic/grupo<n>-<descripcion>" >&2
exit 1