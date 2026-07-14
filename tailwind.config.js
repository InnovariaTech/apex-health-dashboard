/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  			serif: ['Inter', '-apple-system', 'sans-serif'],
  			mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			ink: {
  				DEFAULT: 'var(--ink)',
  				2: 'var(--ink-2)',
  				3: 'var(--ink-3)',
  				4: 'var(--ink-4)',
  				inv: 'var(--ink-inv)'
  			},
  			surface: {
  				DEFAULT: 'var(--surface)',
  				2: 'var(--surface-2)',
  				3: 'var(--surface-3)'
  			},
  			opt: {
  				DEFAULT: 'var(--opt)',
  				soft: 'var(--opt-soft)'
  			},
  			bord: {
  				DEFAULT: 'var(--bord)',
  				soft: 'var(--bord-soft)'
  			},
  			att: {
  				DEFAULT: 'var(--att)',
  				soft: 'var(--att-soft)'
  			},
  			info: {
  				DEFAULT: 'var(--info)',
  				soft: 'var(--info-soft)'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'apex-pulse': {
  				'0%': { transform: 'scale(0.6)', opacity: '0.55' },
  				'100%': { transform: 'scale(1.8)', opacity: '0' }
  			},
  			'apex-blink': {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '0.3' }
  			},
  			'apex-fade-up': {
  				from: { opacity: '0', transform: 'translateY(8px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'apex-pulse': 'apex-pulse 1.8s ease-out infinite',
  			'apex-blink': 'apex-blink 1.4s ease-in-out infinite',
  			'apex-fade-up': 'apex-fade-up 350ms ease-out backwards'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}