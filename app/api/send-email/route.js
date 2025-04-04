import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const { to, subject, html, mockId } = await req.json();

    if (!mockId) {
      console.error("❌ Error: Mock ID is missing!");
      return Response.json({ success: false, message: "Mock ID is required!" });
    }

    // ✅ Construct the correct PDF filename
    const pdfFileName = `Interview_Feedback_Report_${mockId}.pdf`;
    const pdfPath = path.join(process.cwd(), "public", pdfFileName);

    // ✅ Check if the file exists
    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ Error: File ${pdfPath} not found!`);
      return Response.json({ success: false, message: `PDF file ${pdfFileName} not found!` });
    }

    // ✅ Read the PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);

    // ✅ Setup email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // ⚠️ Ensure you're using an App Password for Gmail
      },
    });

    // ✅ Send email with attachment
    await transporter.sendMail({
      from: `"HireSphere" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: pdfFileName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log("✅ Email sent successfully!");
    return Response.json({ success: true, message: "Email sent successfully!" });

  } catch (error) {
    console.error("❌ Email Error:", error);
    return Response.json({ success: false, message: "Failed to send email", error: error.message });
  }
}
