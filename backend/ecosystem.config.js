module.exports = {
  apps: [{
    name: 'autolawn',
    script: 'src/app.js',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      API_URL: 'https://autolawn.app',
      FRONTEND_URL: 'https://autolawn.app',
      MONGODB_URI: 'mongodb+srv://chperry66:Testing@rbdb.umkoeqi.mongodb.net/test?retryWrites=true&w=majority',
      MAILGUN_API_KEY: '5e815ebf2f0143bcadc3803bc30b4aab-5dcb5e36-5f11c10f',
      MAILGUN_DOMAIN: 'sandbox09d83e81a23b4fcfb478c417424df18d.mailgun.org',
      VONAGE_API_KEY: '509d82f6',
      VONAGE_API_SECRET: 'DJ9Wi2wU2L8CwW27',
      VONAGE_SMS_FROM: '17162770383',
      JWT_SECRET: 'ObUfi3Q7Vm4ja752sqUzGwVjSnbyjVduC2SuRp5ozzA',
      SESSION_SECRET: 'A7f5J9kL3uP2Z1tV',
      STRIPE_SECRET_KEY: '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',
      STRIPE_WEBHOOK_SECRET: 'we_1QDCsUE1a6rnB8cNNjNABgwA'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true
  }]
};
