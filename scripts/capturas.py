"""Captura as telas do portfólio e recolhe erros de console.

Uso: python scripts/capturas.py [base_url]
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"
SAIDA = Path("/tmp/capturas")
SAIDA.mkdir(parents=True, exist_ok=True)

TELAS = [
    ("home", "/", False),
    ("projetos", "/projects", False),
    ("sobre", "/sobre", True),
    ("detalhe-guilda", "/projeto/1", True),
    ("detalhe-nuclear", "/projeto/17", True),
    ("contato", "/contato", False),
]

erros = []


def rolar_tudo(pagina):
    """Rola a página inteira para disparar os IntersectionObserver do Revelar.

    Sem isso a captura full_page sai com tudo abaixo da dobra em opacity-0.
    """
    altura = pagina.evaluate("document.body.scrollHeight")
    passo = 600
    for y in range(0, altura + passo, passo):
        pagina.evaluate(f"window.scrollTo(0, {y})")
        pagina.wait_for_timeout(120)
    pagina.evaluate("window.scrollTo(0, 0)")
    pagina.wait_for_timeout(800)

with sync_playwright() as p:
    navegador = p.chromium.launch(headless=True)

    # Desktop
    ctx = navegador.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
    pagina = ctx.new_page()
    pagina.on("console", lambda m: erros.append(f"[console.{m.type}] {m.text}") if m.type == "error" else None)
    pagina.on("pageerror", lambda e: erros.append(f"[pageerror] {e}"))

    for nome, rota, pagina_inteira in TELAS:
        pagina.goto(BASE + rota)
        pagina.wait_for_load_state("networkidle")
        pagina.wait_for_timeout(1200)  # deixa as animações de entrada terminarem
        if pagina_inteira:
            rolar_tudo(pagina)
        pagina.screenshot(path=str(SAIDA / f"{nome}.png"), full_page=pagina_inteira)
        print(f"ok  {nome:18} {rota}")

    # Troca de idioma na home
    pagina.goto(BASE + "/")
    pagina.wait_for_load_state("networkidle")
    pagina.get_by_role("button", name="Mudar para inglês").click()
    pagina.wait_for_timeout(700)
    pagina.screenshot(path=str(SAIDA / "home-en.png"))
    print("ok  home-en            / (EN)")

    ctx.close()

    # Mobile — a versão anterior não tinha navegação nenhuma aqui
    ctx_m = navegador.new_context(
        viewport={"width": 390, "height": 844}, device_scale_factor=3, is_mobile=True, has_touch=True
    )
    pm = ctx_m.new_page()
    pm.on("pageerror", lambda e: erros.append(f"[mobile pageerror] {e}"))
    pm.goto(BASE + "/")
    pm.wait_for_load_state("networkidle")
    pm.wait_for_timeout(1000)
    pm.screenshot(path=str(SAIDA / "mobile-home.png"))

    pm.get_by_role("button", name="Abrir menu").click()
    pm.wait_for_timeout(500)
    pm.screenshot(path=str(SAIDA / "mobile-menu.png"))
    print("ok  mobile-home + menu")

    pm.goto(BASE + "/projects")
    pm.wait_for_load_state("networkidle")
    pm.wait_for_timeout(900)
    pm.screenshot(path=str(SAIDA / "mobile-projetos.png"))
    print("ok  mobile-projetos")

    ctx_m.close()
    navegador.close()

print("\n--- erros de console ---")
print("\n".join(erros) if erros else "nenhum")
