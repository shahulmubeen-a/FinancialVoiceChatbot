from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ParsedFinancialData:
    gross_income: Optional[float] = None
    net_pay: Optional[float] = None
    federal_tax: Optional[float] = None
    state_tax: Optional[float] = None
    social_security: Optional[float] = None
    medicare: Optional[float] = None
    health_insurance: Optional[float] = None
    retirement_401k: Optional[float] = None
    other_deductions: Optional[float] = None
    total_deductions: Optional[float] = None
    pay_period: Optional[str] = None
    employer_name: Optional[str] = None
    currency_symbol: str = "$"
    extra_fields: dict = field(default_factory=dict)

    def to_prompt_block(self) -> str:
        sym = self.currency_symbol  # use detected symbol, not hardcoded $

        def fmt(val: Optional[float]) -> str:
            if val is None:
                return "NOT FOUND"
            return f"{sym}{val:,.2f}"

        lines = [
            "=== EXTRACTED FINANCIAL DATA (verified) ===",
            f"Currency:           {sym}",
            f"Gross Income:       {fmt(self.gross_income)}",
            f"Federal/Income Tax: {fmt(self.federal_tax)}",
            f"State/Local Tax:    {fmt(self.state_tax)}",
            f"Social Security/NI: {fmt(self.social_security)}",
            f"Medicare:           {fmt(self.medicare)}",
            f"Health Insurance:   {fmt(self.health_insurance)}",
            f"401(k)/Pension:     {fmt(self.retirement_401k)}",
            f"Other Deductions:   {fmt(self.other_deductions)}",
            f"Total Deductions:   {fmt(self.total_deductions)}",
            f"Net Pay:            {fmt(self.net_pay)}",
            f"Pay Period:         {self.pay_period or 'NOT FOUND'}",
            f"Employer:           {self.employer_name or 'NOT FOUND'}",
        ]

        if self.extra_fields:
            lines.append("Additional Fields:")
            for k, v in self.extra_fields.items():
                lines.append(f"  {k}: {v}")

        lines.append("===========================================")
        return "\n".join(lines)
