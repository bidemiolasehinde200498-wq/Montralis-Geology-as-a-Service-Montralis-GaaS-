"""
Montralis Real-Time Commodities Clearinghouse Ledger.
Tracks £3.5B/year off-take trading spreads and automated 1.5% customs processing royalties.
"""
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel

class MineralTransaction(BaseModel):
    cooperative_id: str
    country_name: str
    mineral_type: str  # "LITHIUM", "COPPER", "COBALT"
    gross_tonnage: float

class MontralisClearinghouse:
    def __init__(self):
        print("🏛️ [Clearinghouse Ledger] Financial Transaction Settlement Matrix Online.")

    def calculate_offtake_settlement(self, tx: MineralTransaction) -> dict:
        """
        Compares local purchase rates against global metal exchange spot indicators.
        Calculates your automated platform spread and 1.5% custom port royalty.
        """
        # Baseline mock global indexing rates per tonne (Simulating LME data lookups)
        market_spot_prices = {
            "LITHIUM": 14200.00,
            "COPPER": 8400.00,
            "COBALT": 28500.00,
            "NICKEL": 16100.00
        }
        
        mineral_key = tx.mineral_type.upper().strip()
        global_spot_rate = market_spot_prices.get(mineral_key, 5000.00)
        
        # Gross market valuation calculation line
        gross_market_value = tx.gross_tonnage * global_spot_rate
        
        # Your proprietary spread advantage (Buying cheap from coops, exporting at LME spot)
        platform_trade_spread_per_tonne = 700.00 
        montralis_arbitrage_profit = tx.gross_tonnage * platform_trade_spread_per_tonne
        
        # Sovereign 1.5% digital port processing toll captured for customs clearance
        sovereign_customs_royalty = gross_market_value * 0.015
        
        # Total capital returning to local cooperative after processing surcharges
        coop_net_payout = gross_market_value - montralis_arbitrage_profit - sovereign_customs_royalty
        
        return {
            "status": "SETTLED_AND_ROUTED",
            "ledger_tx_id": f"MTRL-TX-{str(uuid.uuid4())[:8].upper()}",
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "commodity_vitals": {
                "mineral": mineral_key,
                "volume_tonnes": tx.gross_tonnage,
                "lme_spot_reference": f"£{global_spot_rate:.2f}/t"
            },
            "accounting_ledger": {
                "gross_market_value": f"£{gross_market_value:.2f}",
                "montralis_arbitrage_revenue": f"£{montralis_arbitrage_profit:.2f}",
                "sovereign_customs_port_fee": f"£{sovereign_customs_royalty:.2f}",
                "cooperative_net_disbursement": f"£{coop_net_payout:.2f}"
            }
        }
