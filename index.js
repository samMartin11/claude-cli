#!/usr/bin/env node

const Anthropic = require("@anthropic-ai/sdk");
const { program } = require("commander");
const chalk = require("chalk");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const os = require("os");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

let apiKey = process.env.ANTHROPIC_API_KEY;
let conversationHistory = [];
let currentModel = "claude-opus-4-6";
let totalInputTokens = 0;
let totalOutputTokens = 0;
let messageCount = 0;

program
  .option("-k, --key <key>", "API key (or use ANTHROPIC_API_KEY env var)")
  .option("-m, --model <model>", "Model (default: claude-opus-4-6)")
  .option("-l, --load <file>", "Load a previous conversation")
  .parse();

const options = program.opts();

if (options.key) apiKey = options.key;

if (!apiKey) {
  console.log(chalk.red("❌ Error: API key not provided"));
  console.log(chalk.yellow("Provide via:"));
  console.log(chalk.cyan("  export ANTHROPIC_API_KEY='your-key'"));
  console.log(chalk.cyan("  claude-cli --key 'your-key'"));
  process.exit(1);
}

if (options.model) currentModel = options.model;

if (options.load) {
  try {
    const data = fs.readFileSync(options.load, "utf8");
    const loaded = JSON.parse(data);
    conversationHistory = loaded.messages || [];
    totalInputTokens = loaded.totalInputTokens || 0;
    totalOutputTokens = loaded.totalOutputTokens || 0;
    messageCount = loaded.messageCount || 0;
    console.log(chalk.green(`✓ Loaded conversation from ${options.load}`));
  } catch (e) {
    console.log(chalk.red(`❌ Failed to load file: ${e.message}`));
    process.exit(1);
  }
}

const client = new Anthropic({ apiKey });

function showBanner() {
  console.clear();
  console.log(chalk.hex("#FF6B6B").bold("  ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗"));
  console.log(chalk.hex("#FF8E53").bold("  ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝"));
  console.log(chalk.hex("#FFC107").bold("  ██║     ██║     ███████║██║   ██║██║  ██║█████╗  "));
  console.log(chalk.hex("#4CAF50").bold("  ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  "));
  console.log(chalk.hex("#2196F3").bold("  ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗"));
  console.log(chalk.hex("#9C27B0").bold("   ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝"));
  console.log(chalk.hex("#FF6B6B").bold("                    ██████╗██╗     ██╗               "));
  console.log(chalk.hex("#FF8E53").bold("                   ██╔════╝██║     ██║               "));
  console.log(chalk.hex("#FFC107").bold("                   ██║     ██║     ██║               "));
  console.log(chalk.hex("#4CAF50").bold("                   ██║     ██║     ██║               "));
  console.log(chalk.hex("#2196F3").bold("                   ╚██████╗███████╗██║               "));
  console.log(chalk.hex("#9C27B0").bold("                    ╚═════╝╚══════╝╚═╝               "));
  console.log("");
  console.log(chalk.hex("#FF6B6B").bold("  ╔════════════════════════════════════════════════╗"));
  console.log(chalk.hex("#FF8E53").bold("  ║") + chalk.hex("#FFFFFF").bold("      🚀 Welcome to Claude CLI — Your AI Terminal   ") + chalk.hex("#FF8E53").bold("║"));
  console.log(chalk.hex("#FFC107").bold("  ║") + chalk.hex("#AAAAAA")("        Powered by Anthropic Claude API             ") + chalk.hex("#FFC107").bold("║"));
  console.log(chalk.hex("#4CAF50").bold("  ╚════════════════════════════════════════════════╝"));
  console.log("");
  console.log(chalk.hex("#FF6B6B")("  👤 ") + chalk.white.bold("User   : ") + chalk.hex("#FFC107").bold(os.userInfo().username));
  console.log(chalk.hex("#4CAF50")("  🤖 ") + chalk.white.bold("Model  : ") + chalk.hex("#2196F3").bold(currentModel));
  console.log(chalk.hex("#9C27B0")("  🔑 ") + chalk.white.bold("Key    : ") + chalk.hex("#FF8E53").bold(apiKey.slice(0, 10) + "..."));
  console.log(chalk.hex("#2196F3")("  💻 ") + chalk.white.bold("System : ") + chalk.hex("#4CAF50").bold(`${os.platform()} (${os.arch()})`));
  console.log("");
  console.log(chalk.hex("#FF6B6B").bold("  ┌─────────────────────────────────────────────┐"));
  console.log(chalk.hex("#FF6B6B").bold("  │") + chalk.hex("#FFC107")("  💡 Type ") + chalk.hex("#FFFFFF").bold("/help") + chalk.hex("#FFC107")(" for commands, ") + chalk.hex("#FFFFFF").bold("/quit") + chalk.hex("#FFC107")(" to exit       ") + chalk.hex("#FF6B6B").bold("│"));
  console.log(chalk.hex("#FF6B6B").bold("  └─────────────────────────────────────────────┘"));
  console.log("");
}

function showUsage() {
  const totalTokens = totalInputTokens + totalOutputTokens;
  console.log(chalk.bold.yellow("\n📊 Usage Stats:"));
  console.log(chalk.gray("─────────────────────────────"));
  console.log(chalk.white(`  Messages sent   : ${messageCount}`));
  console.log(chalk.white(`  Input tokens    : ${totalInputTokens}`));
  console.log(chalk.white(`  Output tokens   : ${totalOutputTokens}`));
  console.log(chalk.white(`  Total tokens    : ${totalTokens}`));
  console.log(chalk.white(`  Model           : ${currentModel}`));
  console.log(chalk.gray("─────────────────────────────\n"));
}

function exportConversation(format = "txt") {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `claude-export-${timestamp}.${format}`;
  const exportPath = path.join(os.homedir(), "Downloads", filename);

  try {
    if (format === "json") {
      const data = {
        exportedAt: new Date().toISOString(),
        model: currentModel,
        messageCount,
        totalInputTokens,
        totalOutputTokens,
        messages: conversationHistory,
      };
      fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    } else if (format === "txt") {
      let content = `Claude CLI Conversation\n`;
      content += `Exported: ${new Date().toLocaleString("en-IN")}\n`;
      content += `Model: ${currentModel}\n`;
      content += `Messages: ${messageCount}\n`;
      content += `Total Tokens: ${totalInputTokens + totalOutputTokens}\n`;
      content += `${"─".repeat(40)}\n\n`;
      conversationHistory.forEach((msg) => {
        const role = msg.role === "user" ? "You" : "Claude";
        content += `${role}:\n${msg.content}\n\n`;
        content += `${"─".repeat(40)}\n\n`;
      });
      fs.writeFileSync(exportPath, content);
    } else if (format === "md") {
      let content = `# Claude CLI Conversation\n\n`;
      content += `- **Exported:** ${new Date().toLocaleString("en-IN")}\n`;
      content += `- **Model:** ${currentModel}\n`;
      content += `- **Messages:** ${messageCount}\n`;
      content += `- **Total Tokens:** ${totalInputTokens + totalOutputTokens}\n\n`;
      content += `---\n\n`;
      conversationHistory.forEach((msg) => {
        const role = msg.role === "user" ? "## 🧑 You" : "## 🤖 Claude";
        content += `${role}\n\n${msg.content}\n\n---\n\n`;
      });
      fs.writeFileSync(exportPath, content);
    }
    console.log(chalk.green(`✓ Exported to: ${exportPath}\n`));
  } catch (e) {
    console.log(chalk.red(`❌ Export failed: ${e.message}\n`));
  }
}

function showHelp() {
  console.log(chalk.bold.yellow("\n📖 Commands:"));
  console.log(chalk.gray("─────────────────────────────────────────"));
  console.log(chalk.cyan("  /quit") + "              Exit the CLI");
  console.log(chalk.cyan("  /clear") + "             Clear conversation history");
  console.log(chalk.cyan("  /usage") + "             Show token usage stats");
  console.log(chalk.cyan("  /export") + "            Export as .txt (default)");
  console.log(chalk.cyan("  /export json") + "       Export as .json");
  console.log(chalk.cyan("  /export md") + "         Export as .md (Markdown)");
  console.log(chalk.cyan("  /model <name>") + "      Switch model mid-conversation");
  console.log(chalk.cyan("  /history") + "           Show message count");
  console.log(chalk.cyan("  /help") + "              Show this help");
  console.log(chalk.gray("─────────────────────────────────────────\n"));
}

async function chat(userMessage) {
  conversationHistory.push({ role: "user", content: userMessage });
  messageCount++;

  try {
    process.stdout.write(chalk.hex("#2196F3").bold("\nClaude: "));
    let fullResponse = "";

    const stream = client.messages.stream({
      model: currentModel,
      max_tokens: 2048,
      messages: conversationHistory,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        process.stdout.write(chunk.delta.text);
        fullResponse += chunk.delta.text;
      }
    }

    const finalMessage = await stream.finalMessage();
    totalInputTokens += finalMessage.usage.input_tokens;
    totalOutputTokens += finalMessage.usage.output_tokens;

    console.log(
      chalk.gray(
        ` [↑${finalMessage.usage.input_tokens} ↓${finalMessage.usage.output_tokens}]\n`
      )
    );

    conversationHistory.push({ role: "assistant", content: fullResponse });
  } catch (error) {
    console.error(chalk.red("\n❌ Error:"), error.message, "\n");
  }
}

async function main() {
  showBanner();

  while (true) {
    const userInput = await question(chalk.hex("#FFC107").bold("You: "));
    const trimmed = userInput.trim();

    if (!trimmed) continue;

    if (trimmed === "/quit") {
      console.log(chalk.hex("#FF6B6B").bold("\n👋 Goodbye! See you next time.\n"));
      rl.close();
      break;
    }

    if (trimmed === "/clear") {
      conversationHistory = [];
      totalInputTokens = 0;
      totalOutputTokens = 0;
      messageCount = 0;
      showBanner();
      continue;
    }

    if (trimmed === "/usage") { showUsage(); continue; }
    if (trimmed === "/history") {
      console.log(chalk.yellow(`\n📝 Messages in history: ${conversationHistory.length}\n`));
      continue;
    }
    if (trimmed === "/help") { showHelp(); continue; }

    if (trimmed.startsWith("/export")) {
      const parts = trimmed.split(" ");
      const format = parts[1] || "txt";
      if (!["txt", "json", "md"].includes(format)) {
        console.log(chalk.red("❌ Format must be: txt, json, or md\n"));
      } else if (conversationHistory.length === 0) {
        console.log(chalk.red("❌ Nothing to export yet\n"));
      } else {
        exportConversation(format);
      }
      continue;
    }

    if (trimmed.startsWith("/model")) {
      const parts = trimmed.split(" ");
      if (!parts[1]) {
        console.log(chalk.red("❌ Usage: /model claude-sonnet-4-6\n"));
      } else {
        currentModel = parts[1];
        console.log(chalk.green(`✓ Model switched to: ${currentModel}\n`));
      }
      continue;
    }

    await chat(trimmed);
  }
}

main();
