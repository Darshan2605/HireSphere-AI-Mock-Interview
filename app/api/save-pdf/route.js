import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { pdfData, mockId } = await req.json(); // Base64 PDF + mockId

    if (!pdfData || !mockId) {
      return NextResponse.json({ error: "Missing PDF data or mockId" }, { status: 400 });
    }

    // Convert Base64 to Buffer
    const pdfBuffer = Buffer.from(pdfData, "base64");

    // Return the buffer again as base64 (for safety)
    return NextResponse.json({
      success: true,
      fileName: `Interview_Feedback_Report_${mockId}.pdf`,
      pdfBuffer: pdfBuffer.toString("base64"),
    });
  } catch (error) {
    console.error("❌ Error in save-pdf:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
