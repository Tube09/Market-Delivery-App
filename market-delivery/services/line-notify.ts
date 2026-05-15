// services/line-notify.ts
// ระบบแจ้งเตือนผ่าน LINE Notify
// เอกสาร: https://notify-bot.line.me/doc/en/

// ===== ส่งข้อความ LINE Notify =====
export async function sendLineNotify(message: string): Promise<boolean> {
  const token = process.env.LINE_NOTIFY_TOKEN

  // ถ้าไม่มี token ให้ skip (ไม่ error)
  if (!token) {
    console.warn('⚠️ LINE_NOTIFY_TOKEN ไม่ได้ตั้งค่า')
    return false
  }

  try {
    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ message }),
    })

    if (!response.ok) {
      console.error('LINE Notify error:', response.status)
      return false
    }

    return true
  } catch (error) {
    console.error('LINE Notify failed:', error)
    return false
  }
}

// ===== Template ข้อความแจ้งเตือน =====

// แจ้งออเดอร์ใหม่
export async function notifyNewOrder(orderId: string, customerName: string, amount: number) {
  const message = `
🛍️ ออเดอร์ใหม่!
━━━━━━━━━━━━━━
ออเดอร์: #${orderId.slice(-8).toUpperCase()}
ลูกค้า: ${customerName}
ยอดรวม: ฿${amount.toLocaleString('th-TH')}
━━━━━━━━━━━━━━
กรุณาตรวจสอบในระบบ`

  return sendLineNotify(message)
}

// แจ้งอัปโหลดสลิป
export async function notifySlipUploaded(orderId: string, customerName: string, amount: number) {
  const message = `
💳 มีการอัปโหลดสลิป!
━━━━━━━━━━━━━━
ออเดอร์: #${orderId.slice(-8).toUpperCase()}
ลูกค้า: ${customerName}
ยอด: ฿${amount.toLocaleString('th-TH')}
━━━━━━━━━━━━━━
กรุณาตรวจสอบสลิปในระบบ`

  return sendLineNotify(message)
}

// แจ้งเปลี่ยนสถานะออเดอร์
export async function notifyOrderStatusChanged(
  orderId: string,
  newStatus: string,
  customerName: string
) {
  const statusEmoji: Record<string, string> = {
    confirmed:  '✅',
    preparing:  '👨‍🍳',
    delivering: '🛵',
    delivered:  '🎉',
    cancelled:  '❌',
  }

  const statusLabel: Record<string, string> = {
    confirmed:  'ยืนยันออเดอร์แล้ว',
    preparing:  'กำลังเตรียมสินค้า',
    delivering: 'กำลังจัดส่ง',
    delivered:  'จัดส่งสำเร็จ',
    cancelled:  'ยกเลิกออเดอร์',
  }

  const emoji = statusEmoji[newStatus] || '📦'
  const label = statusLabel[newStatus] || newStatus

  const message = `
${emoji} อัปเดตออเดอร์
━━━━━━━━━━━━━━
ออเดอร์: #${orderId.slice(-8).toUpperCase()}
ลูกค้า: ${customerName}
สถานะ: ${label}
━━━━━━━━━━━━━━`

  return sendLineNotify(message)
}
