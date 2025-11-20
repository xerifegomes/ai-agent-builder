#!/bin/bash

# Script para corrigir params em route handlers para Next.js 16
# Params agora é Promise<{}> ao invés de {}

echo "Corrigindo route handlers para Next.js 16..."

# Lista de arquivos para corrigir
files=(
  "app/api/agents/[agentId]/analytics/route.ts"
  "app/api/agents/[agentId]/tests/export/route.ts"
  "app/api/agents/[agentId]/tests/route.ts"
  "app/api/agents/[agentId]/tests/[testId]/route.ts"
  "app/api/agents/[agentId]/tests/[testId]/execute/route.ts"
  "app/api/conversations/[id]/route.ts"
  "app/api/conversations/[id]/messages/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processando $file..."
    
    # Adicionar await params no início de cada função
    # Substituir { params }: { params: { ... } } por context: { params: Promise<{ ... }> }
    # E adicionar const params = await context.params no início
    
    # Por enquanto, vamos apenas marcar para revisão manual
    echo "  ⚠️  Precisa de correção manual"
  fi
done

echo "✅ Verificação completa. Arquivos precisam de await params."
