#!/usr/bin/env bash
# Double-click this file to start backend and frontend and open the app

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    if [ ! -z "$SERVE_PID" ]; then
        kill $SERVE_PID 2>/dev/null
    fi
    if [ ! -z "$DEV_PID" ]; then
        kill $DEV_PID 2>/dev/null
    fi
    # Kill any remaining processes
    pkill -f "bun.*serve" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo "Cleanup complete. Press any key to exit..."
    read -n 1 -s
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Ensure script runs in project root
cd "$(dirname "$0")"

echo "Globe ERP - Setting up and starting the application..."
echo ""

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "ERROR: Bun is not installed or not in PATH."
    echo "Please install Bun from https://bun.sh/"
    echo ""
    echo "Press any key to exit..."
    read -n 1 -s
    exit 1
fi

# Check if node_modules exists, if not, run setup
if [ ! -d "node_modules" ]; then
    echo "First time setup detected. Running initial setup..."
    echo ""
    
    echo "Installing dependencies..."
    bun install
    
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies."
        echo "Please check your internet connection and try again."
        echo ""
        echo "Press any key to exit..."
        read -n 1 -s
        exit 1
    fi
    
    echo ""
    echo "Setup completed successfully!"
    echo ""
fi

echo "Starting backend and frontend servers..."
echo ""
echo "The application will be available at:"
echo "Frontend: http://localhost:8080"
echo "Backend API: http://localhost:4000/api"
echo ""
echo "To stop the servers, press Ctrl+C or close this terminal window"
echo ""

# Start backend server in background
echo "Starting backend server..."
bun run serve &
SERVE_PID=$!

# Start frontend server in background  
echo "Starting frontend server..."
bun run dev &
DEV_PID=$!

# Function to check if server is responding
check_server() {
    local url=$1
    local name=$2
    
    for i in {1..30}; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $name is running"
            return 0
        fi
        echo "Checking $name... ($i/30)"
        sleep 2
    done
    echo "❌ $name failed to start after 60 seconds"
    return 1
}

echo ""
echo "Waiting for servers to start..."

# Check backend server
if check_server "http://localhost:4000/api/products" "Backend server"; then
    # Check frontend server
    if check_server "http://localhost:8080" "Frontend server"; then
        echo ""
        echo "🌐 Opening browser..."
        
        # Try different browser opening methods based on OS
        if command -v open &> /dev/null; then
            # macOS
            open http://localhost:8080 2>/dev/null
        elif command -v xdg-open &> /dev/null; then
            # Linux
            xdg-open http://localhost:8080 2>/dev/null
        elif command -v start &> /dev/null; then
            # Windows (if running in Git Bash or similar)
            start http://localhost:8080 2>/dev/null
        else
            echo "Could not auto-open browser. Please open: http://localhost:8080"
        fi
        
        echo ""
        echo "✅ All servers are running and browser opened!"
        echo ""
        echo "Press Ctrl+C to stop the servers, or close this window."
        echo ""
        
        # Keep the script running and wait for user input or termination
        while true; do
            sleep 1
            # Check if background processes are still running
            if ! kill -0 $SERVE_PID 2>/dev/null || ! kill -0 $DEV_PID 2>/dev/null; then
                echo "One or more servers have stopped unexpectedly."
                echo "Check the output above for any error messages."
                echo ""
                echo "Press any key to exit..."
                read -n 1 -s
                exit 1
            fi
        done
    else
        echo "Frontend server failed to start. Exiting..."
        exit 1
    fi
else
    echo "Backend server failed to start. Exiting..."
    exit 1
fi
