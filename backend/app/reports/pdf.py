from datetime import date
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Table, TableStyle

from app.schemas.optimize import OptimizeResponse

_TEAL = colors.HexColor("#006a7f")
_ACCENT = colors.HexColor("#e09743")
_LIGHT = colors.HexColor("#dcf5fb")
_TEXT = colors.HexColor("#0f211e")


def _pct(value: float, digits: int = 1) -> str:
    return f"{value * 100:.{digits}f}%"


def build_report(response: OptimizeResponse, title: str = "Optimized Portfolio") -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        leftMargin=0.8 * inch,
        rightMargin=0.8 * inch,
        title=f"PortfoliU — {title}",
    )
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], textColor=_TEAL, fontSize=22, spaceAfter=2)
    sub = ParagraphStyle("sub", parent=styles["Normal"], textColor=colors.grey, fontSize=10, spaceAfter=16)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=_TEXT, fontSize=13, spaceBefore=14, spaceAfter=6)
    note = ParagraphStyle("note", parent=styles["Normal"], textColor=colors.grey, fontSize=8, spaceBefore=18)

    metrics = response.metrics
    story = [
        Paragraph("PortfoliU", h1),
        Paragraph(f"{title} · generated {date.today().isoformat()}", sub),
    ]

    summary_rows = [
        ["Objective", response.objective.replace("_", " ").title()],
        ["Risk model", response.risk_model.replace("_", " ").title()],
        ["Data provider", response.provider],
        ["Period", f"{response.as_of_start} → {response.as_of_end}"],
        ["Assets", str(response.n_assets)],
        ["Solver", response.solver_status],
    ]
    story.append(Paragraph("Summary", h2))
    story.append(_kv_table(summary_rows))

    story.append(Paragraph("Performance", h2))
    story.append(
        _kv_table(
            [
                ["Expected annual return", _pct(metrics.expected_return)],
                ["Annual volatility", _pct(metrics.volatility)],
                ["Sharpe ratio", f"{metrics.sharpe_ratio:.2f}"],
            ]
        )
    )

    story.append(Paragraph("Holdings", h2))
    holdings = [["Ticker", "Weight", "Sector"]]
    for allocation in response.weights:
        holdings.append([allocation.ticker, _pct(allocation.weight, 2), allocation.sector or "—"])
    story.append(_holdings_table(holdings))

    story.append(
        Paragraph(
            "This report is generated for educational purposes and is not investment advice. "
            "Figures are model estimates based on historical data.",
            note,
        )
    )

    doc.build(story)
    return buffer.getvalue()


def _kv_table(rows: list[list[str]]) -> Table:
    table = Table(rows, colWidths=[2.2 * inch, 3.6 * inch])
    table.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.grey),
                ("TEXTCOLOR", (1, 0), (1, -1), _TEXT),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("LINEBELOW", (0, 0), (-1, -1), 0.4, _LIGHT),
            ]
        )
    )
    return table


def _holdings_table(rows: list[list[str]]) -> Table:
    table = Table(rows, colWidths=[1.6 * inch, 1.6 * inch, 2.6 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), _TEAL),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _LIGHT]),
                ("LINEBELOW", (0, 0), (-1, 0), 1, _ACCENT),
            ]
        )
    )
    return table


def _weights_table(rows: list[list[str]]) -> Table:
    table = Table(rows, colWidths=[2.9 * inch, 2.9 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), _TEAL),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _LIGHT]),
                ("LINEBELOW", (0, 0), (-1, 0), 1, _ACCENT),
            ]
        )
    )
    return table


def _fmt_pct(value: object) -> str:
    return _pct(float(value)) if isinstance(value, (int, float)) else "—"


def _fmt_ratio(value: object) -> str:
    return f"{float(value):.2f}" if isinstance(value, (int, float)) else "—"


def build_saved_report(
    *,
    name: str,
    created_at: str,
    objective: str,
    risk_model: str,
    weights: dict[str, float],
    metrics: dict,
) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        leftMargin=0.8 * inch,
        rightMargin=0.8 * inch,
        title=f"PortfoliU — {name}",
    )
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], textColor=_TEAL, fontSize=22, spaceAfter=2)
    sub = ParagraphStyle("sub", parent=styles["Normal"], textColor=colors.grey, fontSize=10, spaceAfter=16)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=_TEXT, fontSize=13, spaceBefore=14, spaceAfter=6)
    note = ParagraphStyle("note", parent=styles["Normal"], textColor=colors.grey, fontSize=8, spaceBefore=18)

    items = sorted(weights.items(), key=lambda item: item[1], reverse=True)
    hhi = sum(weight * weight for weight in weights.values())
    effective = 1.0 / hhi if hhi > 0 else float(len(weights))
    largest = items[0] if items else ("—", 0.0)

    story = [
        Paragraph("PortfoliU", h1),
        Paragraph(f"{name} · saved {created_at}", sub),
        Paragraph("Configuration", h2),
        _kv_table(
            [
                ["Objective", objective.replace("_", " ").title()],
                ["Risk model", risk_model.replace("_", " ").title()],
                ["Holdings", str(len(weights))],
                ["Saved", created_at],
            ]
        ),
        Paragraph("Performance", h2),
        _kv_table(
            [
                ["Expected annual return", _fmt_pct(metrics.get("expected_return"))],
                ["Annual volatility", _fmt_pct(metrics.get("volatility"))],
                ["Sharpe ratio", _fmt_ratio(metrics.get("sharpe_ratio"))],
            ]
        ),
        Paragraph("Diversification", h2),
        _kv_table(
            [
                ["Effective holdings", f"{effective:.1f}"],
                ["Concentration (HHI)", f"{hhi:.3f}"],
                ["Largest position", f"{largest[0]} ({_pct(float(largest[1]), 1)})"],
            ]
        ),
        Paragraph("Holdings", h2),
        _weights_table([["Ticker", "Weight"]] + [[ticker, _pct(float(weight), 2)] for ticker, weight in items]),
        Paragraph(
            "This report is generated for educational purposes and is not investment advice. "
            "Figures reflect the portfolio as saved, based on historical model estimates.",
            note,
        ),
    ]

    doc.build(story)
    return buffer.getvalue()
