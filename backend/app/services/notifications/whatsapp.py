import logging
import httpx
import os
from typing import Optional

class WhatsAppService:
    def __init__(self):
        self.logger = logging.getLogger("campusai.whatsapp")
        self.api_key = os.getenv("WA_API_KEY")
        self.provider_url = os.getenv("WA_PROVIDER_URL", "https://api.whatsapp.provider/send")
        self.is_mock = os.getenv("WA_MOCK_MODE", "true").lower() == "true"

    async def send_message(self, to_number: str, message: str) -> bool:
        """
        Send a WhatsApp message. 
        Supports Mock mode for local development and real API integration.
        """
        if self.is_mock:
            self.logger.info(f" [MOCK WA] To: {to_number} | Msg: {message}")
            return True

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.provider_url,
                    json={
                        "to": to_number,
                        "text": message,
                        "api_key": self.api_key
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                self.logger.info(f"WA message sent to {to_number}")
                return True
        except Exception as e:
            self.logger.error(f"Failed to send WA message: {str(e)}")
            return False

    async def send_academic_alert(self, student_name: str, to_number: str, alert_type: str, detail: str):
        """Predefined templates for academic alerts."""
        templates = {
            "low_gpa": f"Halo {student_name}, CampusAI mendeteksi IPK kamu saat ini ({detail}) berada di bawah standar. Segera hubungi Dosen Wali untuk konsultasi.",
            "krs_deadline": f"Halo {student_name}, pendaftaran KRS akan ditutup dalam {detail}. Pastikan kamu sudah melengkapi isian KRS kamu.",
            "thesis_update": f"Halo {student_name}, ada feedback baru dari Dosen Pembimbing untuk draf skripsi kamu: '{detail}'",
        }
        
        msg = templates.get(alert_type, f"Halo {student_name}, ada notifikasi baru dari CampusAI: {detail}")
        return await self.send_message(to_number, msg)

whatsapp_service = WhatsAppService()
