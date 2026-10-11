// Ngữ pháp cho bài mua trong cửa hàng.
module.exports = [
  { id: 'kara_made', title: 'Từ ... đến ...: から・まで',
    explain: [
      '「A から B まで」 nghĩa là "từ A đến B". Dùng được cho thời gian và địa điểm.',
      'から đứng sau điểm bắt đầu, まで đứng sau điểm kết thúc.',
      '「～から です」 nghĩa là "bắt đầu từ ...".'
    ],
    pool: ['から', 'まで', 'じ', 'です', 'に'],
    sentences: [
      ['わたし は くじ から ごじ まで はたらきます', 'Tôi làm việc từ 9 giờ đến 5 giờ.'],
      ['がっこう は はちじ から です', 'Trường học bắt đầu từ 8 giờ.'],
      ['うち から えき まで あるきます', 'Tôi đi bộ từ nhà đến ga.'],
      ['げつようび から きんようび まで がっこう です', 'Từ thứ hai đến thứ sáu là đi học.'],
      ['ここ から えき まで ちかい です', 'Từ đây đến ga thì gần.'],
      ['なんじ から なんじ まで です か', 'Từ mấy giờ đến mấy giờ vậy?']
    ]},
  { id: 'ne_yo', title: 'Cuối câu: ね và よ',
    explain: [
      'ね ở cuối câu để tìm sự đồng cảm: "...nhỉ", "...nhé".',
      'よ ở cuối câu để báo cho người nghe điều họ chưa biết: "...đấy", "...nhé".',
      'Hai từ này làm câu nói tự nhiên và thân thiện hơn.'
    ],
    pool: ['ね', 'よ', 'です', 'か', 'ます'],
    sentences: [
      ['いい てんき です ね', 'Thời tiết đẹp nhỉ.'],
      ['この ラーメン は おいしい です ね', 'Món ramen này ngon nhỉ.'],
      ['あした は やすみ です よ', 'Ngày mai được nghỉ đấy.'],
      ['これ は わたし の かさ です よ', 'Đây là ô của tôi đấy.'],
      ['きょう は さむい です ね', 'Hôm nay lạnh nhỉ.'],
      ['いっしょ に いきましょう ね', 'Cùng đi nhé.']
    ]}
];
