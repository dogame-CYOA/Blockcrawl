# 🚀 Solana Transaction Visualizer

A modern, secure web application for visualizing Solana blockchain transactions with interactive network graphs and detailed transaction analysis.

![Solana Transaction Visualizer](https://img.shields.io/badge/Solana-Transaction%20Visualizer-9333ea?style=for-the-badge&logo=solana)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=for-the-badge&logo=vercel)

## ✨ Features

- 🔍 **Interactive Graph Visualization** - Pan, zoom, and explore transaction networks with Cytoscape.js
- 🎨 **Beautiful UI** - Modern gradient design with smooth animations and dark mode support
- 🔒 **Secure Architecture** - API keys protected via serverless functions with comprehensive security headers
- ⚡ **Rate Limited** - Protected against abuse with Redis-based rate limiting (10 requests/minute)
- 📱 **Responsive Design** - Works perfectly on desktop and mobile devices
- 🎯 **Transaction Analysis** - Detailed breakdown of NFTs and SPL tokens with metadata
- 🚀 **Performance Optimized** - Fast loading with efficient data processing
- 🌙 **Dark Mode** - Toggle between light and dark themes with persistent preferences
- ⏰ **Time Filters** - Filter transactions by time range (15min, 1h, 24h, 7d, 30d, custom)
- 🔄 **Traffic Filters** - View incoming, outgoing, or both directions of transactions
- 🏷️ **Entity Identification** - Automatic detection of known entities (DEXs, marketplaces, wallets, etc.)
- 📊 **Token Metadata** - Rich token information including symbols, decimals, and project details
- 🎨 **Visual Indicators** - Color-coded nodes and edges based on entity types and transaction types
- 🔗 **External Links** - Direct links to Solscan for transaction verification
- 📈 **Real-time Processing** - Live transaction count and processing status

## 🛡️ Security Features

- ✅ **API Key Protection**: Never exposed to client-side code
- ✅ **Rate Limiting**: 10 requests per minute per IP with Redis
- ✅ **Input Validation**: Comprehensive Solana address validation and sanitization
- ✅ **Error Handling**: Secure error messages without sensitive data exposure
- ✅ **Security Headers**: XSS protection, content type options, frame options, CSP
- ✅ **HTTPS Enforced**: Secure communication via Vercel with HSTS
- ✅ **Request Size Limits**: 1MB maximum request size
- ✅ **CORS Protection**: Domain-specific CORS policies
- ✅ **Environment Validation**: Server-side environment variable validation
- ✅ **Request Logging**: Comprehensive request monitoring and logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Helius API key ([get one here](https://dev.helius.xyz/))
- An Upstash Redis database ([create one here](https://console.upstash.com/)) (optional but recommended)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/dogame-CYOA/blockcrawl.git
cd blockcrawl
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local and add your API keys
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Helius API Configuration (Required)
HELIUS_API_KEY=your_helius_api_key_here

# Upstash Redis Configuration (Optional, for rate limiting)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here
```

### Getting API Keys

1. **Helius API Key**:
   - Visit [Helius Developer Portal](https://dev.helius.xyz/)
   - Sign up for a free account
   - Create a new API key
   - Copy the key to your `.env.local` file

2. **Upstash Redis** (Optional, for rate limiting):
   - Visit [Upstash Console](https://console.upstash.com/)
   - Create a free Redis database
   - Set eviction policy to "noeviction"
   - Copy the REST URL and token to your `.env.local` file

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push your code to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Vercel**
- Visit [Vercel](https://vercel.com)
- Import your GitHub repository
- Add environment variables in the Vercel dashboard
- Deploy!

### Environment Variables in Vercel

Add these environment variables in your Vercel project settings:

- `HELIUS_API_KEY`: Your Helius API key (required)
- `UPSTASH_REDIS_REST_URL`: Your Upstash Redis URL (optional)
- `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis token (optional)

## 📁 Project Structure

```
blockcrawl/
├── components/                    # React components
│   ├── LoadingSpinner.js         # Loading animation with record count
│   ├── TransactionDetails.js     # Transaction analysis with filters
│   └── TransactionVisualizer.js  # Interactive graph visualization
├── lib/                          # Utility libraries
│   ├── entity-identifier.js      # Entity identification and metadata
│   ├── ratelimit.js              # Rate limiting utility
│   └── config.js                 # Configuration and validation
├── pages/                        # Next.js pages
│   ├── api/                      # API routes
│   │   ├── transactions.js       # Main transaction API endpoint
│   │   └── test-helius-simple.js # Debug endpoint
│   ├── _app.js                   # App wrapper
│   └── index.js                  # Main page with filters
├── styles/                       # Global styles
│   └── globals.css               # Global CSS
├── public/                       # Static assets
│   └── favicon.svg               # Application favicon
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── next.config.js                # Next.js configuration with security headers
├── package.json                  # Dependencies
├── README.md                     # This file
└── SECURITY.md                   # Security documentation
```

## 🔍 How It Works

### 1. User Input
- User enters a Solana wallet address
- Frontend validates the address format
- User can select time range and traffic filters
- Request is sent to the serverless API

### 2. API Processing
- Serverless function validates input and applies rate limiting
- Helius API is called to fetch enriched transaction data
- Data is filtered by time range if specified
- Transactions are processed into nodes and edges
- Entity identification is performed for all addresses
- Token metadata is fetched for all tokens

### 3. Visualization
- Cytoscape.js renders the interactive transaction graph
- Nodes are color-coded by entity type
- Edges show transaction details on hover
- Dark mode support with theme persistence
- Traffic filters show incoming/outgoing/both directions

### 4. Security
- API keys are never exposed to the client
- Rate limiting prevents abuse
- Comprehensive input validation and sanitization
- Security headers prevent XSS, clickjacking, and other attacks
- Error messages don't leak sensitive information

## 🎨 Features in Detail

### Time Filters
- **15 minutes**: Recent activity
- **1 hour**: Short-term analysis
- **24 hours**: Daily overview
- **7 days**: Weekly patterns
- **30 days**: Monthly trends
- **Custom range**: Flexible date selection

### Traffic Filters
- **Both directions**: All transactions
- **Incoming only**: Transactions received by the wallet
- **Outgoing only**: Transactions sent from the wallet

### Entity Identification
The system automatically identifies and categorizes:
- 🏪 **NFT Marketplaces**: Magic Eden, Tensor, etc.
- 💱 **DEXs**: Jupiter, Raydium, Orca, etc.
- 🏦 **Staking Platforms**: Marinade, Lido, etc.
- 💼 **Wallets**: Phantom, Solflare, etc.
- 🌉 **Bridges**: Wormhole, Allbridge, etc.
- 🏛️ **CEX Hot Wallets**: Exchange wallets
- 💰 **Lending Platforms**: Solend, Mango, etc.
- 🌾 **Yield Farming**: Various DeFi protocols
- 🎮 **Gaming Platforms**: Gaming-related addresses
- 🔗 **DeFi Protocols**: Various DeFi services
- 🔮 **Oracles**: Pyth, Switchboard, etc.
- 🏛️ **DAOs**: Decentralized organizations

### Token Metadata
- Token symbols and names
- Decimal places
- Project information
- Market data (when available)

## 🐛 Troubleshooting

### Common Issues

1. **"API key not configured" error**
   - Check that `HELIUS_API_KEY` is set in your environment variables
   - Verify the key is valid in the Helius dashboard

2. **Rate limiting errors**
   - The app includes built-in rate limiting (10 requests/minute)
   - Wait for the rate limit to reset or check your Upstash Redis configuration

3. **No transaction data**
   - Try a different wallet address with more activity
   - Use a longer time range (30 days instead of 15 minutes)
   - Check that the wallet has NFT or SPL token transactions

4. **Build errors**
   - Ensure Node.js 18+ is installed
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Debug Mode

The application includes comprehensive logging. Check Vercel function logs for detailed debugging information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Helius](https://helius.xyz/) for the Solana API
- [Upstash](https://upstash.com/) for Redis rate limiting
- [Cytoscape.js](https://cytoscape.org/) for graph visualization
- [Next.js](https://nextjs.org/) for the framework
- [Vercel](https://vercel.com/) for deployment
- [Solscan](https://solscan.io/) for transaction verification links

## 📞 Support

If you encounter any issues or have questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing [issues](https://github.com/dogame-CYOA/blockcrawl/issues)
3. Create a new issue with detailed information

## 🔮 Future Enhancements

- [ ] Support for deeper transaction analysis (separation > 1)
- [ ] Export functionality (PNG, SVG, JSON)
- [ ] Advanced filtering options (by token type, amount, etc.)
- [ ] Real-time transaction monitoring
- [ ] Multi-wallet comparison
- [ ] Historical transaction trends
- [ ] Mobile app version
- [ ] Additional blockchain support
- [ ] Advanced analytics and insights

---

**⚠️ Disclaimer**: This tool is for educational and analytical purposes only. Transaction data is fetched from public blockchain records. Always verify information independently and never use this tool for financial advice. 