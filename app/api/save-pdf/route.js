import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req) {
  try {
    const { pdfData, mockId } = await req.json(); // Extract Base64 PDF Data and mockId

    if (!pdfData || !mockId) {
      return new Response(JSON.stringify({ error: "Missing PDF data or mockId" }), { status: 400 });
    }

    // Convert Base64 to Buffer
    const pdfBuffer = Buffer.from(pdfData, "base64");

    // Define the save path with mockId
    const fileName = `Interview_Feedback_Report_${mockId}.pdf`;
    const savePath = path.join(process.cwd(), "public", fileName);

    // Save the file
    await writeFile(savePath, pdfBuffer);

    return Response.json({ success: true, filePath: `/public/${fileName}` });
  } catch (error) {
    console.error("Error saving PDF:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
