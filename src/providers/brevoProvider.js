const Brevo = require('@getbrevo/brevo')
import { env } from '~/config/environment'

let apiInstance = new Brevo.TransactionalEmailsApi()
let apiKey = apiInstance.authentications['apiKey']
apiKey.apiKey = env.BREVO_API_KEY

const sendEmail = async (toEmail, customSubject, htmlContent) => {
  // khởi tạo sendSmtpEmail với những thông tin cần thiết
  let sendSmtpEmail = new Brevo.SendSmtpEmail()

  // tài khoản gửi mail
  sendSmtpEmail.sender = { name: env.ADMIN_EMAIL_NAME, email: env.ADMIN_EMAIL_ADDRESS }

  // Những tài khoản nhận mail
  sendSmtpEmail.to = [{ email: toEmail }]

  // tieu de email
  sendSmtpEmail.subject = customSubject

  // noi dung
  sendSmtpEmail.htmlContent = htmlContent

  // Gọi hành động gửi mail
  return apiInstance.sendTransacEmail(sendSmtpEmail)
}

export const BrevoProvider = {
  sendEmail,
}
