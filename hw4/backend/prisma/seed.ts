import { PrismaClient, TreasureType } from '../src/generated/prisma';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// 台北地區的經緯度範圍
const TAIPEI_BOUNDS = {
  lat: { min: 25.0, max: 25.15 },
  lng: { min: 121.45, max: 121.65 }
};

// 台北著名地點
const TAIPEI_LANDMARKS = [
  { name: '台北101', lat: 25.0330, lng: 121.5654, address: '台北市信義區信義路五段7號' },
  { name: '中正紀念堂', lat: 25.0365, lng: 121.5200, address: '台北市中正區中山南路21號' },
  { name: '龍山寺', lat: 25.0366, lng: 121.5009, address: '台北市萬華區廣州街211號' },
  { name: '西門町', lat: 25.0420, lng: 121.5070, address: '台北市萬華區成都路' },
  { name: '士林夜市', lat: 25.0877, lng: 121.5240, address: '台北市士林區大東路、大南路' },
  { name: '象山', lat: 25.0235, lng: 121.5711, address: '台北市信義區信義路五段150巷' },
  { name: '陽明山', lat: 25.1556, lng: 121.5598, address: '台北市北投區竹子湖路' },
  { name: '淡水老街', lat: 25.1677, lng: 121.4362, address: '新北市淡水區中正路' },
  { name: '九份老街', lat: 25.1099, lng: 121.8445, address: '新北市瑞芳區基山街' },
  { name: '北投溫泉', lat: 25.1367, lng: 121.5074, address: '台北市北投區溫泉路' }
];

// 寶藏內容模板
const TREASURE_TEMPLATES = {
  [TreasureType.text]: [
    '這裡隱藏著一個美麗的故事...',
    '在這個角落，我發現了人生的道理',
    '每當夕陽西下，這裡總是特別美麗',
    '這是我最喜歡的秘密基地',
    '在這裡遇見了改變我一生的人'
  ],
  [TreasureType.music]: [
    '這首歌總是讓我想起這個地方',
    '在這裡聽音樂特別有感覺',
    '這是我創作靈感的來源地',
    '每次經過都會哼起這首歌'
  ],
  [TreasureType.audio]: [
    '錄下了這裡特有的聲音',
    '這裡的鳥叫聲很特別',
    '記錄下雨天的聲音',
    '街頭音樂家的演奏'
  ],
  [TreasureType.link]: [
    '分享一個關於這個地點的有趣連結',
    '這裡有個很棒的網站介紹',
    '推薦一個相關的影片',
    '有用的旅遊資訊連結'
  ],
  [TreasureType.live_moment]: [
    '此刻在這裡的美好時光',
    '現在這裡正在發生有趣的事',
    '實時分享這個瞬間',
    '當下的感動記錄'
  ]
};

// 常用標籤
const COMMON_TAGS = [
  ['美食', '小吃', '餐廳'],
  ['景點', '觀光', '拍照'],
  ['咖啡', '下午茶', '放鬆'],
  ['歷史', '文化', '古蹟'],
  ['購物', '市集', '商店'],
  ['自然', '公園', '綠地'],
  ['夜生活', '酒吧', '娛樂'],
  ['藝術', '展覽', '創作'],
  ['運動', '健身', '戶外'],
  ['學習', '書店', '圖書館']
];

function getRandomLocation() {
  return {
    latitude: faker.number.float({
      min: TAIPEI_BOUNDS.lat.min,
      max: TAIPEI_BOUNDS.lat.max,
      fractionDigits: 6
    }),
    longitude: faker.number.float({
      min: TAIPEI_BOUNDS.lng.min,
      max: TAIPEI_BOUNDS.lng.max,
      fractionDigits: 6
    })
  };
}

function getRandomTags() {
  const tagGroups = faker.helpers.arrayElements(COMMON_TAGS, { min: 1, max: 3 });
  const tags = tagGroups.flat();
  return faker.helpers.arrayElements(tags, { min: 1, max: 4 });
}

function getRandomTreasureContent(type: TreasureType) {
  const templates = TREASURE_TEMPLATES[type];
  return faker.helpers.arrayElement(templates);
}

async function createUsers() {
  console.log('🔨 Creating users...');
  
  const users = [];
  for (let i = 0; i < 20; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email({ firstName, lastName }),
        name: `${firstName} ${lastName}`,
        avatar: faker.image.avatar(),
        googleId: faker.string.alphanumeric(21),
        createdAt: faker.date.past({ years: 2 })
      }
    });
    users.push(user);
  }
  
  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function createTreasures(users: any[]) {
  console.log('🔨 Creating treasures...');
  
  const treasures = [];
  
  // 在著名地點創建一些寶藏
  for (const landmark of TAIPEI_LANDMARKS) {
    const user = faker.helpers.arrayElement(users);
    const type = faker.helpers.enumValue(TreasureType);
    
    const treasure = await prisma.treasure.create({
      data: {
        userId: user.id,
        title: `${landmark.name}的秘密`,
        content: getRandomTreasureContent(type),
        type,
        latitude: landmark.lat + faker.number.float({ min: -0.001, max: 0.001, fractionDigits: 6 }),
        longitude: landmark.lng + faker.number.float({ min: -0.001, max: 0.001, fractionDigits: 6 }),
        address: landmark.address,
        mediaUrl: type === TreasureType.music || type === TreasureType.audio 
          ? faker.internet.url() 
          : undefined,
        linkUrl: type === TreasureType.link 
          ? faker.internet.url() 
          : undefined,
        isLiveLocation: type === TreasureType.live_moment,
        locationRadius: faker.number.int({ min: 10, max: 100 }),
        tags: getRandomTags(),
        likesCount: faker.number.int({ min: 0, max: 50 }),
        commentsCount: faker.number.int({ min: 0, max: 20 }),
        createdAt: faker.date.past({ years: 1 })
      }
    });
    treasures.push(treasure);
  }
  
  // 創建隨機位置的寶藏
  for (let i = 0; i < 100; i++) {
    const user = faker.helpers.arrayElement(users);
    const type = faker.helpers.enumValue(TreasureType);
    const location = getRandomLocation();
    
    const treasure = await prisma.treasure.create({
      data: {
        userId: user.id,
        title: faker.lorem.sentence({ min: 3, max: 8 }),
        content: getRandomTreasureContent(type),
        type,
        latitude: location.latitude,
        longitude: location.longitude,
        address: faker.location.streetAddress(),
        mediaUrl: type === TreasureType.music || type === TreasureType.audio 
          ? faker.internet.url() 
          : undefined,
        linkUrl: type === TreasureType.link 
          ? faker.internet.url() 
          : undefined,
        isLiveLocation: type === TreasureType.live_moment && faker.datatype.boolean({ probability: 0.2 }),
        locationRadius: faker.number.int({ min: 10, max: 100 }),
        tags: getRandomTags(),
        likesCount: faker.number.int({ min: 0, max: 50 }),
        commentsCount: faker.number.int({ min: 0, max: 20 }),
        createdAt: faker.date.past({ years: 1 }),
        deletedAt: faker.datatype.boolean({ probability: 0.05 }) 
          ? faker.date.recent() 
          : null // 5% 的寶藏被軟刪除
      }
    });
    treasures.push(treasure);
  }
  
  console.log(`✅ Created ${treasures.length} treasures`);
  return treasures;
}

async function createLikes(users: any[], treasures: any[]) {
  console.log('🔨 Creating likes...');
  
  const likes = [];
  const activeTreasures = treasures.filter(t => !t.deletedAt);
  
  for (let i = 0; i < 300; i++) {
    const user = faker.helpers.arrayElement(users);
    const treasure = faker.helpers.arrayElement(activeTreasures);
    
    // 避免重複按讚
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_treasureId: {
          userId: user.id,
          treasureId: treasure.id
        }
      }
    });
    
    if (!existingLike) {
      const like = await prisma.like.create({
        data: {
          userId: user.id,
          treasureId: treasure.id,
          createdAt: faker.date.past({ years: 1 })
        }
      });
      likes.push(like);
    }
  }
  
  console.log(`✅ Created ${likes.length} likes`);
  return likes;
}

async function createComments(users: any[], treasures: any[]) {
  console.log('🔨 Creating comments...');
  
  const comments = [];
  const activeTreasures = treasures.filter(t => !t.deletedAt);
  
  const commentTexts = [
    '太棒了！感謝分享這個地方',
    '我也去過這裡，真的很棒',
    '下次一定要去看看',
    '這個角度拍照一定很美',
    '謝謝推薦，已收藏',
    '原來這裡這麼有趣',
    '期待更多分享',
    '這個描述讓我很想去',
    '很有意思的地方',
    '下回經過會注意看看'
  ];
  
  for (let i = 0; i < 200; i++) {
    const user = faker.helpers.arrayElement(users);
    const treasure = faker.helpers.arrayElement(activeTreasures);
    
    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        treasureId: treasure.id,
        content: faker.helpers.arrayElement(commentTexts),
        createdAt: faker.date.past({ years: 1 }),
        deletedAt: faker.datatype.boolean({ probability: 0.03 }) 
          ? faker.date.recent() 
          : null // 3% 的留言被軟刪除
      }
    });
    comments.push(comment);
  }
  
  console.log(`✅ Created ${comments.length} comments`);
  return comments;
}

async function createFavorites(users: any[], treasures: any[]) {
  console.log('🔨 Creating favorites...');
  
  const favorites = [];
  const activeTreasures = treasures.filter(t => !t.deletedAt);
  
  for (let i = 0; i < 150; i++) {
    const user = faker.helpers.arrayElement(users);
    const treasure = faker.helpers.arrayElement(activeTreasures);
    
    // 避免重複收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_treasureId: {
          userId: user.id,
          treasureId: treasure.id
        }
      }
    });
    
    if (!existingFavorite) {
      const favorite = await prisma.favorite.create({
        data: {
          userId: user.id,
          treasureId: treasure.id,
          createdAt: faker.date.past({ years: 1 })
        }
      });
      favorites.push(favorite);
    }
  }
  
  console.log(`✅ Created ${favorites.length} favorites`);
  return favorites;
}

async function updateCounts() {
  console.log('🔨 Updating counts...');
  
  // 更新寶藏的按讚數和留言數
  const treasures = await prisma.treasure.findMany({
    where: { deletedAt: null }
  });
  
  for (const treasure of treasures) {
    const likesCount = await prisma.like.count({
      where: { treasureId: treasure.id }
    });
    
    const commentsCount = await prisma.comment.count({
      where: { 
        treasureId: treasure.id,
        deletedAt: null
      }
    });
    
    await prisma.treasure.update({
      where: { id: treasure.id },
      data: {
        likesCount,
        commentsCount
      }
    });
  }
  
  console.log('✅ Updated counts');
}

async function main() {
  console.log('🌱 Starting seed...');
  
  try {
    // 清空現有數據
    console.log('🗑️  Cleaning existing data...');
    await prisma.favorite.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.treasure.deleteMany();
    await prisma.user.deleteMany();
    
    // 創建測試數據
    const users = await createUsers();
    const treasures = await createTreasures(users);
    const likes = await createLikes(users, treasures);
    const comments = await createComments(users, treasures);
    const favorites = await createFavorites(users, treasures);
    
    // 更新計數
    await updateCounts();
    
    console.log('🎉 Seed completed successfully!');
    console.log(`
📊 Summary:
- Users: ${users.length}
- Treasures: ${treasures.length}
- Likes: ${likes.length}
- Comments: ${comments.length}
- Favorites: ${favorites.length}
    `);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});