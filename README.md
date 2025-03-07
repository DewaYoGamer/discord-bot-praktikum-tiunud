<h1>Discord Bot for Praktikum TI UNUD</h1>

<h2>Overview</h2>
<p>This Discord bot is designed to assist with the management and organization of practical courses (Praktikum) at the Information Technology of Universitas Udayana.</p>

<h2>Features</h2>
<ul>
  <li><strong>Creating Asdos Role together with they praktikan's role.</strong></li>
  <li><strong>Role Picker for Praktikan</strong></li>
</ul>

<h2>Installation</h2>
<ol>
  <li>Clone the repository:
    <pre><code>git clone https://github.com/DewaYoGamer/discord-bot-praktikum-tiunud.git
cd discord-bot-praktikum-tiunud</code></pre>
  </li>
  <li>Install dependencies:
    <pre><code>npm install</code></pre>
  </li>
  <li>Configure your environment variables (create a <code>.env</code> file):
    <pre><code>DISCORD_TOKEN=&ltYOUR BOT SECRET&gt
CLIENT_ID=&ltYOUR APP ID&gt
GUILD_ID=&ltYOUR SERVER ID&gt
ASDOS_ROLE_ID=&ltYOUR ASDOS ROLE'S ID&gt</code></pre>
Note: <code>GUILD_ID</code> is optional that used for development only.
  </li>
  <li>Start the bot:
    <pre><code>npm start</code></pre>
  </li>
  <li>Add praktikan.json with <code>up-praktikans</code> command, The structure are:
  <pre><code>[
  {
    "NIM":"2305551001",
    "name":"John Doe"
  }
]</code></pre>
  </li>
</ol>

<h2>Contributing</h2>
<p>Contributions are welcome! Please feel free to submit a Pull Request.</p>

<h2>License</h2>
<p>This project is licensed under the MIT License - see the LICENSE file for details.</p>
