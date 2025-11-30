const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require("fs");
const path = require("path");

// =====================
// 1. 생일 / 설정 관련 상수
// =====================
const BIRTHDAY_FILE = path.join(__dirname, "birthdays.json");
const BIRTHDAY_CHANNEL_ID = "1260292142543147202";     // 생일 축하 보낼 채널
const ROLE_ID = "1260292139493883912";                 // 뉴페관리자 역할 ID

// 서버별 생일 데이터
let birthdays = {};
try {
  const raw = fs.readFileSync(BIRTHDAY_FILE, "utf8");
  birthdays = JSON.parse(raw);
} catch (e) {
  birthdays = {};
}

function saveBirthdays() {
  fs.writeFileSync(BIRTHDAY_FILE, JSON.stringify(birthdays, null, 2), "utf8");
}

// =====================
// 2. 디스코드 클라이언트
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =====================
// 3. ready 이벤트
// =====================
client.on("ready", () => {
  console.log(`로그인 성공: ${client.user.tag}`);

  // 1시간마다 한 번씩 생일 체크
  setInterval(checkBirthdays, 60 * 60 * 1000);
});

// =====================
// 4. 메시지 처리
// =====================
client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;

  // --- !환영 ---
  if (msg.content.startsWith("!환영")) {
    const mentionedUser = msg.mentions.users.first();

    if (!mentionedUser) {
      msg.channel.send("누구를 환영할지 멘션해줘! 예: `!환영 @유저`");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor("#ffc1dc")
      .setDescription(
`┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━»•» 🌸 «•«━┑

　　　　　　　⋅.｡  𐐪 **만담** 𐑂 ‧₊˚⊹

✨  새로운 별이 찾아왔어요.  
모두 따뜻하게 맞아주세요. 🌙

👉 **${mentionedUser} 님**, 저희 서버에 오신 걸 환영해요.

적응이 어려우시다면  
언제든지 **@🐣⚘⠂◜뉴페관리자◞⠂⚘🐣** 를 찾아주세요.

다른 역할을 원하신다면  
<#1260292141230587974> 에서 자유롭게 받아주세요.

궁금한 점이나 건의 사항이 있다면  
<#1260292142543147198> 에 남겨주시면 감사드릴게요.

편안한 밤, 편안한 대화가 되길 바랄게요. 🌙

┕━»•» 🌸 «•«━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙`
      );

    // 역할 멘션 + 임베드 전송
    msg.channel.send({
      content: `<@&${ROLE_ID}>`,
      embeds: [embed]
    });
  }

  // --- !생일등록 ---
  if (msg.content.startsWith("!생일등록")) {
    const args = msg.content.trim().split(/\s+/);
    if (args.length < 2) {
      msg.channel.send("사용법: `!생일등록 MM-DD` 예: `!생일등록 12-16`");
      return;
    }

    const date = args[1]; // "MM-DD"
    if (!/^\d{2}-\d{2}$/.test(date)) {
      msg.channel.send("형식이 이상해! `MM-DD` 형식으로 적어줘. 예: `12-16`");
      return;
    }

    const [mm, dd] = date.split("-");
    const month = Number(mm);
    const day = Number(dd);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      msg.channel.send("존재할 수 없는 날짜야. 다시 확인해줘!");
      return;
    }

    const guildId = msg.guild.id;
    if (!birthdays[guildId]) birthdays[guildId] = {};

    birthdays[guildId][msg.author.id] = date;
    saveBirthdays();

    msg.channel.send(`🎂 ${msg.author} 님 생일을 **${date}** 로 저장했어!`);
  }

  // --- !생일삭제 ---
  if (msg.content.startsWith("!생일삭제")) {
    const guildId = msg.guild.id;

    if (!birthdays[guildId] || !birthdays[guildId][msg.author.id]) {
      msg.channel.send("삭제할 생일 정보가 없어요. 먼저 `!생일등록`으로 등록해줘!");
      return;
    }

    delete birthdays[guildId][msg.author.id];

    // 서버에 아무도 안 남았으면 그 길드 자체도 정리
    if (Object.keys(birthdays[guildId]).length === 0) {
      delete birthdays[guildId];
    }

    saveBirthdays();
    msg.channel.send("✅ 생일 정보를 삭제했어요.");
  }
});

// =====================
// 5. 생일 체크 함수들
// =====================
function getTodayKST() {
  const now = new Date();
  const kst = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const mm = String(kst.getMonth() + 1).padStart(2, "0");
  const dd = String(kst.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

function checkBirthdays() {
  const today = getTodayKST();
  console.log("오늘 날짜(KST):", today);

  for (const [guildId, users] of Object.entries(birthdays)) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const channel = guild.channels.cache.get(BIRTHDAY_CHANNEL_ID);
    if (!channel) continue;

    for (const [userId, date] of Object.entries(users)) {
      if (date === today) {
        channel.send(`@everyone 🎂 오늘은 <@${userId}> 님의 생일이에요! 모두 축하해 주세요! 🎉`);
      }
    }
  }
}

// =====================
// 6. 로그인
// =====================
const token = process.env.DISCORD_TOKEN;

console.log("DISCORD_TOKEN length:", (token || "").length);

if (!token) {
  console.error("❌ DISCORD_TOKEN이 설정되어 있지 않습니다.");
  process.exit(1);
}

client.login(token);
