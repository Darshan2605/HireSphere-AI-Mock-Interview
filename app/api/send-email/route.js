import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { to, subject, html, mockId, pdfBufferBase64 } = await req.json();

    if (!mockId || !pdfBufferBase64) {
      return Response.json({ success: false, message: "Mock ID or PDF buffer missing!" });
    }

    // Convert base64 back to buffer
    const pdfBuffer = Buffer.from(pdfBufferBase64, "base64");
    const fileName = `Interview_Feedback_Report_${mockId}.pdf`;

    // Email config
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"HireSphere" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log("✅ Email sent successfully!");
    return Response.json({ success: true, message: "Email sent successfully!" });

  } catch (error) {
    console.error("❌ Email Send Error:", error);
    return Response.json({ success: false, message: "Failed to send email", error: error.message });
  }
}
