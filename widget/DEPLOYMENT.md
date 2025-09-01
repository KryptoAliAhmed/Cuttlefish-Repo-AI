# 🚀 Deployment Guide

## Quick Deploy Options

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Deploy automatically with zero configuration

### Netlify
1. Build the project: \`npm run build\`
2. Upload the \`.next\` folder to Netlify
3. Configure build settings if needed

### Manual Deployment
1. Run \`npm run build\` to create production build
2. Run \`npm start\` to serve the application
3. Deploy to any hosting service that supports Node.js

## Environment Variables

No environment variables are required for basic functionality.

## Performance Tips

- The widget is optimized for 60fps rendering
- 3D models are preloaded for smooth experience
- Shader materials are cached for better performance
- Responsive design works on all screen sizes

## Troubleshooting

### Model Loading Issues
- Ensure GLB files are in \`public/models/\` directory
- Check browser console for loading errors
- Verify file paths are correct

### Performance Issues
- Reduce shader complexity if needed
- Lower frame rate for mobile devices
- Use fallback geometry if models fail to load
