// Danh sách đồ trong cửa hàng.
// slot: hat (mũ), outfit (áo), glasses (kính), accessory (phụ kiện), bg (hình nền), theme (giao diện màu)
// kind: "gear" = đồ mặc/dùng được (mua 1 lần), "consumable" = đồ dùng một lần (có số lượng)
module.exports = [
  // ---------- Mũ ----------
  { id: 'hat_straw',    kind: 'gear', slot: 'hat', name: 'Nón rơm',          icon: '👒', price: 40,  desc: 'Nón rơm mát mẻ mùa hè.' },
  { id: 'hat_kabuto',   kind: 'gear', slot: 'hat', name: 'Mũ samurai',        icon: '⛑️', price: 120, desc: 'Mũ chiến binh Kabuto oai phong.' },
  { id: 'hat_ribbon',   kind: 'gear', slot: 'hat', name: 'Nơ đỏ',            icon: '🎀', price: 60,  desc: 'Chiếc nơ xinh xắn.' },
  { id: 'hat_party',    kind: 'gear', slot: 'hat', name: 'Mũ sinh nhật',      icon: '🥳', price: 80,  desc: 'Mỗi ngày đều là tiệc.' },
  { id: 'hat_crown',    kind: 'gear', slot: 'hat', name: 'Vương miện',        icon: '👑', price: 300, desc: 'Dành cho mèo vua.' },

  // ---------- Áo ----------
  { id: 'outfit_kimono',  kind: 'gear', slot: 'outfit', name: 'Kimono hồng',    icon: '👘', price: 150, desc: 'Kimono hoa anh đào.' },
  { id: 'outfit_happi',   kind: 'gear', slot: 'outfit', name: 'Áo happi lễ hội', icon: '🏮', price: 110, desc: 'Áo happi đi lễ hội matsuri.' },
  { id: 'outfit_hoodie',  kind: 'gear', slot: 'outfit', name: 'Áo hoodie xanh', icon: '🧥', price: 90,  desc: 'Ấm áp, thoải mái.' },
  { id: 'outfit_ninja',   kind: 'gear', slot: 'outfit', name: 'Đồ ninja',       icon: '🥷', price: 220, desc: 'Lặng lẽ như bóng đêm.' },

  // ---------- Kính ----------
  { id: 'glasses_round',  kind: 'gear', slot: 'glasses', name: 'Kính tròn',    icon: '👓', price: 50,  desc: 'Trông thật thông thái.' },
  { id: 'glasses_sun',    kind: 'gear', slot: 'glasses', name: 'Kính râm',     icon: '🕶️', price: 90,  desc: 'Ngầu hết cỡ.' },
  { id: 'glasses_heart',  kind: 'gear', slot: 'glasses', name: 'Kính trái tim', icon: '😍', price: 100, desc: 'Nhìn đời màu hồng.' },

  // ---------- Phụ kiện ----------
  { id: 'acc_scarf',     kind: 'gear', slot: 'accessory', name: 'Khăn len đỏ',   icon: '🧣', price: 70,  desc: 'Quàng khăn cho ấm cổ.' },
  { id: 'acc_bell',      kind: 'gear', slot: 'accessory', name: 'Chuông vàng',   icon: '🔔', price: 55,  desc: 'Leng keng leng keng.' },
  { id: 'acc_fan',       kind: 'gear', slot: 'accessory', name: 'Quạt giấy',     icon: '🪭', price: 85,  desc: 'Quạt sensu truyền thống.' },
  { id: 'acc_dango',     kind: 'gear', slot: 'accessory', name: 'Xiên bánh dango', icon: '🍡', price: 65, desc: 'Món ăn vặt yêu thích của mèo.' },

  // ---------- Hình nền ----------
  { id: 'bg_sakura',   kind: 'gear', slot: 'bg', name: 'Vườn anh đào',   icon: '🌸', price: 100, desc: 'Cánh hoa rơi nhẹ nhàng.' },
  { id: 'bg_fuji',     kind: 'gear', slot: 'bg', name: 'Núi Phú Sĩ',     icon: '🗻', price: 160, desc: 'Biểu tượng của nước Nhật.' },
  { id: 'bg_night',    kind: 'gear', slot: 'bg', name: 'Đêm lễ hội',     icon: '🎆', price: 180, desc: 'Pháo hoa rực rỡ trên trời.' },
  { id: 'bg_torii',    kind: 'gear', slot: 'bg', name: 'Cổng torii',     icon: '⛩️', price: 140, desc: 'Cổng đền thần đạo màu đỏ.' },

  // ---------- Giao diện màu ----------
  { id: 'theme_sakura', kind: 'gear', slot: 'theme', name: 'Giao diện Sakura',  icon: '🌸', price: 0,   desc: 'Hồng anh đào (mặc định).' },
  { id: 'theme_matcha', kind: 'gear', slot: 'theme', name: 'Giao diện Matcha',  icon: '🍵', price: 120, desc: 'Xanh trà matcha dịu mắt.' },
  { id: 'theme_night',  kind: 'gear', slot: 'theme', name: 'Giao diện Đêm tối', icon: '🌙', price: 150, desc: 'Nền tối, đỡ mỏi mắt buổi tối.' },
  { id: 'theme_indigo', kind: 'gear', slot: 'theme', name: 'Giao diện Chàm',    icon: '🎐', price: 130, desc: 'Xanh chàm kiểu aizome.' },

  // ---------- Đồ dùng một lần ----------
  { id: 'heart_1',     kind: 'consumable', slot: 'use', name: 'Bình hồi 1 tim',   icon: '❤️', price: 30,  desc: 'Hồi ngay 1 tim.' },
  { id: 'heart_full',  kind: 'consumable', slot: 'use', name: 'Hồi đầy tim',      icon: '💖', price: 90,  desc: 'Hồi đầy toàn bộ tim.' },
  { id: 'freeze',      kind: 'consumable', slot: 'use', name: 'Khiên giữ chuỗi',  icon: '🛡️', price: 70,  desc: 'Tự động giữ chuỗi ngày học khi bạn lỡ 1 ngày.' },
  { id: 'coin_boost',  kind: 'consumable', slot: 'use', name: 'Bùa nhân đôi xu',  icon: '🧧', price: 60,  desc: 'Nhân đôi xu nhận được trong 60 phút.' }
];
