"""Exercita a bancada de encaixe: clique, arrasto, remoção e teclado.

Uso: python scripts/testa-bancada.py [base_url]
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"
SAIDA = Path("/tmp/capturas")
SAIDA.mkdir(parents=True, exist_ok=True)

falhas = []


def checa(condicao, msg):
    print(("  ok   " if condicao else "  FALHA ") + msg)
    if not condicao:
        falhas.append(msg)


def contagem(pagina):
    """Quantos cards de projeto estão na grade."""
    return pagina.locator("article").count()


with sync_playwright() as p:
    nav = p.chromium.launch(headless=True)
    ctx = nav.new_context(viewport={"width": 1440, "height": 1000}, device_scale_factor=2)
    pg = ctx.new_page()
    erros = []
    pg.on("pageerror", lambda e: erros.append(str(e)))

    pg.goto(BASE + "/projects")
    pg.wait_for_load_state("networkidle")
    pg.wait_for_timeout(1000)

    total = contagem(pg)
    print(f"\nTotal sem filtro: {total}")
    checa(total == 18, "18 projetos sem filtro")

    # --- clique ---
    print("\nClique numa peça")
    pg.get_by_role("button", name="Jogos", exact=True).click()
    pg.wait_for_timeout(500)
    jogos = contagem(pg)
    checa(0 < jogos < total, f"filtrou por Jogos ({jogos} de {total})")
    checa(
        pg.locator('[data-bancada] button[aria-pressed="true"]').count() == 1,
        "peça aparece encaixada na bancada",
    )
    pg.screenshot(path=str(SAIDA / "bancada-1peca.png"), clip={"x": 0, "y": 150, "width": 1440, "height": 700})

    # --- segunda peça, de outra gaveta ---
    print("\nSegunda peça")
    pg.get_by_role("button", name="Unity", exact=True).click()
    pg.wait_for_timeout(500)
    dois = contagem(pg)
    checa(dois <= jogos, f"Jogos + Unity estreitou ({dois})")
    checa(
        pg.locator('[data-bancada] button[aria-pressed="true"]').count() == 2,
        "duas peças encaixadas",
    )
    pg.screenshot(path=str(SAIDA / "bancada-2pecas.png"), clip={"x": 0, "y": 150, "width": 1440, "height": 700})

    # --- remover clicando na peça encaixada ---
    print("\nRemover peça encaixada")
    pg.locator('[data-bancada] button[aria-pressed="true"]').first.click()
    pg.wait_for_timeout(500)
    checa(
        pg.locator('[data-bancada] button[aria-pressed="true"]').count() == 1,
        "clique na peça encaixada a solta",
    )

    # --- limpar ---
    pg.get_by_role("button", name="Limpar filtros").click()
    pg.wait_for_timeout(500)
    checa(contagem(pg) == total, "limpar devolve os 18")

    # --- arrasto ---
    print("\nArrasto até a bancada")
    peca = pg.get_by_role("button", name="Ferramentas", exact=True)
    cx = peca.bounding_box()
    alvo = pg.locator("[data-bancada]").bounding_box()
    pg.mouse.move(cx["x"] + cx["width"] / 2, cx["y"] + cx["height"] / 2)
    pg.mouse.down()
    # passos intermediários: sem eles o pointermove não gera velocidade
    for i in range(1, 11):
        pg.mouse.move(
            cx["x"] + (alvo["x"] + alvo["width"] / 2 - cx["x"]) * i / 10,
            cx["y"] + (alvo["y"] + alvo["height"] / 2 - cx["y"]) * i / 10,
        )
        pg.wait_for_timeout(16)
    pg.mouse.up()
    pg.wait_for_timeout(600)
    checa(
        pg.locator('[data-bancada] button[aria-pressed="true"]').count() == 1,
        "arrastar até a bancada encaixa",
    )
    ferramentas = contagem(pg)
    checa(0 < ferramentas < total, f"filtrou por Ferramentas ({ferramentas})")

    # --- arrasto que não chega na bancada deve voltar ---
    print("\nArrasto largado fora")
    antes = contagem(pg)
    peca2 = pg.get_by_role("button", name="C++", exact=True)
    b = peca2.bounding_box()
    pg.mouse.move(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
    pg.mouse.down()
    for i in range(1, 6):
        pg.mouse.move(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2 + 60 * i / 5)
        pg.wait_for_timeout(16)
    pg.mouse.up()
    pg.wait_for_timeout(700)
    checa(contagem(pg) == antes, "largar fora da bancada não filtra")

    # --- teclado ---
    print("\nTeclado")
    pg.get_by_role("button", name="Limpar filtros").click()
    pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Estudos", exact=True).focus()
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(500)
    checa(
        pg.locator('[data-bancada] button[aria-pressed="true"]').count() == 1,
        "Enter no teclado encaixa a peça",
    )

    checa(not erros, f"sem erro de página ({erros[:1]})")

    ctx.close()
    nav.close()

print("\n" + ("TODAS PASSARAM" if not falhas else f"{len(falhas)} FALHA(S): {falhas}"))
sys.exit(1 if falhas else 0)
