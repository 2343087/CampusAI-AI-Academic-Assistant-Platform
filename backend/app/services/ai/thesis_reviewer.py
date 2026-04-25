import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

class ThesisReviewer:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.2
        )

    async def review_draft(self, content: str) -> str:
        """Analyze a thesis draft and provide constructive feedback."""
        prompt = ChatPromptTemplate.from_template("""
        Kamu adalah pakar penulisan akademik dan pembimbing skripsi senior.
        Tugas kamu adalah me-review draft skripsi mahasiswa berikut secara detail.
        
        Berikan feedback dalam format Markdown yang mencakup:
        1. **Kekuatan**: Apa yang sudah bagus dari draft ini.
        2. **Kekurangan**: Apa yang masih kurang (metodologi, data, atau logika).
        3. **Saran Perbaikan**: Langkah konkret untuk memperbaiki draft.
        4. **Pengecekan Struktur**: Apakah sudah sesuai standar penulisan skripsi.
        
        Draft Mahasiswa:
        {content}
        """)
        
        response = await self.llm.ainvoke(prompt.format(content=content))
        return response.content

thesis_reviewer = ThesisReviewer()
