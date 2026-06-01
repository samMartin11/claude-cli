# Claude CLI

A terminal-based interface to interact with Claude AI using the Anthropic API.

## Installation

### Via npm (global)

```bash
npm install -g .
```

Then run from anywhere:

```bash
claude-cli
```

### From source

```bash
git clone <repo-url>
cd claude-cli
npm install
npm start
```

## Setup

You need an Anthropic API key. Get one at [console.anthropic.com](https://console.anthropic.com).

Set your API key as an environment variable:

```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

Or pass it directly via the `--key` flag:

```bash
claude-cli --key 'your-api-key-here'
```

## Usage

Start the CLI:

```bash
claude-cli
```

### Options

- `-k, --key <key>` — API key (or use ANTHROPIC_API_KEY env var)
- `-m, --model <model>` — Model (default: claude-opus-4-6)
- `-l, --load <file>` — Load a previous conversation from a JSON file

### Commands

Type any message to chat with Claude. Or use these commands:

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/quit` | Exit the CLI |
| `/clear` | Clear conversation history |
| `/usage` | Show token usage stats |
| `/history` | Show message count |
| `/export [format]` | Export conversation (txt, json, md) |
| `/model <name>` | Switch model mid-conversation |

### Examples

```bash
# Start with default model
claude-cli

# Use a specific model
claude-cli --model claude-sonnet-4-6

# Load a previous conversation
claude-cli --load ~/Downloads/claude-export-2026-06-02T12-30-45-123Z.json

# Pass API key directly
claude-cli --key sk-ant-xxxxx
```

## Exported Conversations

Conversations are exported to `~/Downloads/` with timestamps. Supported formats:

- **txt** — Plain text with dividers
- **json** — Full conversation data (can be re-loaded with `--load`)
- **md** — Markdown format with sections

## Models

Default model: `claude-opus-4-6`

Available models (as of August 2025):
- `claude-opus-4-7` — Latest flagship model
- `claude-sonnet-4-6` — Balanced performance/speed
- `claude-haiku-4-5` — Fast and compact

Switch models during a conversation:

```
You: /model claude-sonnet-4-6
Claude: ✓ Model switched to: claude-sonnet-4-6
```

## Requirements

- Node.js 16+
- npm or yarn
- Valid Anthropic API key

## Dependencies

- `@anthropic-ai/sdk` — Official Anthropic SDK
- `commander` — CLI argument parsing
- `chalk` — Terminal colors and styling
- Node.js built-ins: `readline`, `fs`, `path`, `os`

## License

MIT — See LICENSE file

## Support

For issues or feature requests, open an issue on GitHub.
