#!/usr/bin/env python3
"""
fix_nav.py — MosmanLAB
Substitui em massa 'simulacoes → simulados' em todos os HTMLs do repositório.
Rode na raiz do repositório: python3 fix_nav.py
"""

import os

# Pares (texto antigo, texto novo) — mais específico primeiro
SUBSTITUICOES = [
    # Padrão exato encontrado nos artigos do blog
    ('<a href="../simulacoes/">Simulações</a>',
     '<a href="../simulados/">Simulados</a>'),

    # Com class="active"
    ('<a href="../simulacoes/" class="active">Simulações</a>',
     '<a href="../simulados/" class="active">Simulados</a>'),
    ('<a class="active" href="../simulacoes/">Simulações</a>',
     '<a class="active" href="../simulados/">Simulados</a>'),

    # Raiz do site (sem ../)
    ('<a href="simulacoes/">Simulações</a>',
     '<a href="simulados/">Simulações</a>'),
    ('<a href="/simulacoes/">Simulações</a>',
     '<a href="/simulados/">Simulados</a>'),

    # Fallback: só o href
    ('href="../simulacoes/"',  'href="../simulados/"'),
    ('href="simulacoes/"',     'href="simulados/"'),
    ('href="/simulacoes/"',    'href="/simulados/"'),

    # Fallback: só o texto
    ('>Simulações<',   '>Simulados<'),
    ('Simulações</a>', 'Simulados</a>'),
]

EXTENSOES = {'.html', '.htm'}
IGNORAR   = {'.git', 'node_modules', '.github', '__pycache__', 'simulados'}


def processar(raiz='.'):
    alterados  = []
    total_html = 0

    for root, dirs, files in os.walk(raiz):
        dirs[:] = [d for d in dirs if d not in IGNORAR]
        for fname in files:
            if os.path.splitext(fname)[1].lower() not in EXTENSOES:
                continue
            path = os.path.join(root, fname)
            total_html += 1

            try:
                with open(path, 'r', encoding='utf-8') as f:
                    conteudo = f.read()
            except Exception as e:
                print(f'  ERRO ao ler {path}: {e}')
                continue

            novo     = conteudo
            mudancas = []
            for (velho, novo_txt) in SUBSTITUICOES:
                if velho in novo:
                    contagem = novo.count(velho)
                    novo = novo.replace(velho, novo_txt)
                    mudancas.append(f'{contagem}x  {velho!r}')

            if mudancas:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(novo)
                alterados.append((path, mudancas))

    print(f'\n{"="*64}')
    print(f'  HTMLs encontrados : {total_html}')
    print(f'  Arquivos alterados: {len(alterados)}')
    print(f'{"="*64}')

    for path, mudancas in alterados:
        print(f'\n  {path}')
        for m in mudancas:
            print(f'    ✓ {m}')

    if not alterados:
        print('\n  Nenhum arquivo precisou de alteração.')
    else:
        print(f'\n{"="*64}')
        print('  Commit sugerido:')
        print('  git add -A')
        print('  git commit -m "nav: simulacoes → simulados em todos os HTMLs"')
        print('  git push')
        print(f'{"="*64}\n')


if __name__ == '__main__':
    import sys
    raiz = sys.argv[1] if len(sys.argv) > 1 else '.'
    print(f'Processando: {os.path.abspath(raiz)}')
    processar(raiz)
