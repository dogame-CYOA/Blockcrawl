# 🚀 Solana Transaction Visualizer

A modern, secure web application for visualizing Solana blockchain transactions with interactive network graphs and detailed transaction analysis.

![Solana Transaction Visualizer](https://img.shields.io/badge/Solana-Transaction%20Visualizer-9333ea?style=for-the-badge&logo=solana)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=for-the-badge&logo=vercel)

## ✨ Features

- 🔍 **Interactive Graph Visualization** - Pan, zoom, and explore transaction networks
- 🎨 **Beautiful UI** - Modern gradient design with smooth animations
- 🔒 **Secure Architecture** - API keys protected via serverless functions
- ⚡ **Rate Limited** - Protected against abuse with Redis-based rate limiting
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🎯 **Transaction Analysis** - Detailed breakdown of NFTs and SPL tokens
- 🚀 **Performance Optimized** - Fast loading with efficient data processing

## 🛡️ Security Features

- ✅ **API Key Protection**: Never exposed to client-side
- ✅ **Rate Limiting**: 10 requests per minute per IP
- ✅ **Input Validation**: Comprehensive address validation
- ✅ **Error Handling**: No sensitive data in error messages
- ✅ **Security Headers**: XSS protection, content type options
- ✅ **HTTPS Enforced**: Secure communication via Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Helius API key ([get one here](https://dev.helius.xyz/))
- An Upstash Redis database ([create one here](https://console.upstash.com/))

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-username/solana-tx-visualizer.git
cd solana-tx-visualizer
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env.local
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
# Helius API Configuration
HELIUS_API_KEY=your_helius_api_key_here

# Upstash Redis Configuration (for rate limiting)
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

- `HELIUS_API_KEY`: Your Helius API key
- `UPSTASH_REDIS_REST_URL`: Your Upstash Redis URL (optional)
- `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis token (optional)

## 📁 Project Structure

```
solana-tx-visualizer/
├── components/                 # React components
│   ├── LoadingSpinner.js      # Loading animation
│   ├── TransactionDetails.js  # Transaction analysis
│   └── TransactionVisualizer.js # Graph visualization
├── lib/                       # Utility libraries
│   ├── helius.js             # Helius API client
│   └── ratelimit.js          # Rate limiting utility
├── pages/                     # Next.js pages
│   ├── api/                   # API routes
│   │   └── transactions.js    # Transaction API endpoint
│   ├── _app.js               # App wrapper
│   └── index.js              # Main page
├── styles/                    # Global styles
│   └── globals.css           # Global CSS
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🔍 How It Works

### 1. User Input
- User enters a Solana wallet address
- Frontend validates the address format
- Request is sent to the serverless API

### 2. API Processing
- Serverless function validates input
- Rate limiting is checked
- Helius API is called to fetch transactions
- Data is processed into nodes and edges

### 3. Visualization
- Cytoscape.js renders the transaction graph
- Interactive features: zoom, pan, node selection
- Detailed transaction information is displayed

### 4. Security
- API keys are never exposed to the client
- Rate limiting prevents abuse
- Input validation prevents malicious requests
- Error messages don't leak sensitive information

## 🎨 Customization

### Styling
The application uses CSS-in-JS with styled-jsx. You can customize:

- Colors: Update the color variables in components
- Layout: Modify the CSS in each component
- Animations: Adjust transition durations and effects

### Features
- **Add more transaction types**: Modify the Helius API call in `lib/helius.js`
- **Change rate limits**: Update the rate limiting configuration in `lib/ratelimit.js`
- **Add new visualizations**: Extend the Cytoscape.js configuration in `TransactionVisualizer.js`

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
   - Check that the wallet has NFT or SPL token transactions

4. **Build errors**
   - Ensure Node.js 18+ is installed
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=true
```

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

## 📞 Support

If you encounter any issues or have questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing [issues](https://github.com/your-username/solana-tx-visualizer/issues)
3. Create a new issue with detailed information

## 🔮 Future Enhancements

- [ ] Support for deeper transaction analysis (separation > 1)
- [ ] Export functionality (PNG, SVG, JSON)
- [ ] Advanced filtering options
- [ ] Real-time transaction monitoring
- [ ] Multi-wallet comparison
- [ ] Historical transaction trends
- [ ] Dark mode support
- [ ] Mobile app version

---

**⚠️ Disclaimer**: This tool is for educational and analytical purposes only. Transaction data is fetched from public blockchain records. Always verify information independently and never use this tool for financial advice. 