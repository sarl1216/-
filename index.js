const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log(`로그인 성공: ${client.user.tag}`);
});

client.on("messageCreate", (msg) => {
  // 명령어 시작
  if (msg.content.startsWith("!환영")) {

    const mentionedUser = msg.mentions.users.first();

    // 멘션 안 했을 때 안내
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

@환영해죠 ! 

┕━»•» 🌸 «•«━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙`
      );

    msg.channel.send({ embeds: [embed] });
  }
});

// 위에는 너가 쓰던 코드들...

// 로그인하기 전에 토큰 체크
const token = process.env.DISCORD_TOKEN;

console.log("DISCORD_TOKEN length:", (token || "").length);

if (!token) {
  console.error("❌ DISCORD_TOKEN이 설정되어 있지 않습니다.");
  process.exit(1);
}

client.login(token);



