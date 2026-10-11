// Nội dung nuôi pet và trồng cây. Chỉnh giá, thời gian ở đây cho hợp ý.
module.exports = {
  // Mua bằng xu
  WATER_PRICE: 3,        // 1 bình nước
  FOOD_PRICE: 6,         // 1 phần thức ăn
  FERT_PRICE: 15,        // 1 bao phân bón
  FERT_SPEEDUP: 0.5,     // bón phân: rút ngắn 50% thời gian còn lại (mỗi cây 1 lần)
  START_WATER: 3,        // quà tặng lúc mở vườn lần đầu
  START_FOOD: 2,

  // Cây trồng. hours = số giờ tưới đủ nước để chín (mỗi lần tưới được 1 giờ). qty = số quả mỗi lần thu hoạch.
  CROPS: {
    carrot: { name: 'Cà rốt',      seed: 8,  hours: 1, qty: 2, sell: 9,  feed: 30 },
    tomato: { name: 'Cà chua',     seed: 20, hours: 3, qty: 2, sell: 23, feed: 45 },
    sakura: { name: 'Hoa anh đào', seed: 50, hours: 6, qty: 2, sell: 55, feed: 0 }
  },
  WATER_STACK_HOURS: 2,  // nước tưới trước được tối đa 2 giờ
  PLOT_START: 3,
  PLOT_MAX: 6,
  PLOT_COSTS: [0, 0, 0, 40, 60, 80], // giá mở ô thứ 4, 5, 6

  // Thú cưng
  PETS: {
    shiba:  { name: 'Chó Shiba', adopt: 100 },
    rabbit: { name: 'Thỏ trắng', adopt: 100 },
    chick:  { name: 'Gà con',    adopt: 80 }
  },
  FOOD_PER_ITEM: 35,     // 1 phần thức ăn / 1 bình nước hồi 35 điểm (tối đa 100)
  WATER_PER_ITEM: 35,
  FOOD_DECAY_PER_HOUR: 3,
  WATER_DECAY_PER_HOUR: 4,
  LOVE_PER_LEVEL: 8,
  PET_REWARD_BASE: 3,    // quà thú cưng mang về mỗi ngày = 3 + 2 xu mỗi cấp, tối đa 15
  PET_REWARD_PER_LEVEL: 2,
  PET_REWARD_MAX: 15,

  // Bạn bè, giới hạn mỗi ngày cho mỗi người bạn
  GIFT_PER_DAY: 5,
  HELP_PER_DAY: 5,
  HARM_PER_DAY: 3,
  LOG_MAX: 30
};
