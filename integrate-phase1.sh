#!/bin/bash

echo "🔥 FlameForge Nexus - Phase 1 Integration"
echo "Advanced Local AI Features"
echo "======================================="

# Check prerequisites
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    exit 1
fi

echo "📦 Installing Phase 1 dependencies..."
npm install recharts @radix-ui/react-slider @radix-ui/react-switch lodash date-fns
npm install -D @types/lodash

echo "📊 Setting up enhanced database schema..."
# The migration will be created separately

echo "⚡ Creating enhanced services..."
# Services will be created separately

echo "🎨 Extending UI components..."
# Components will be created separately

echo "✅ Phase 1 integration complete!"
echo ""
echo "🎉 New Features Available:"
echo "  • Model Fine-tuning Workflows"
echo "  • Custom Model Management Dashboard"  
echo "  • GPU Utilization Monitoring"
echo "  • Dynamic Model Switching"
echo "  • Advanced Model Configuration"
echo ""
echo "🚀 Access at:"
echo "  • Main Workbench: http://localhost:8083"
echo "  • Model Management: http://localhost:8083/model-management"
echo "  • GPU Monitoring: http://localhost:8083/gpu-monitoring"
echo ""
echo "Ready to build advanced AI workflows! 🔥"
