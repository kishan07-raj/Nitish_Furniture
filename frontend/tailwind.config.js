// Nitish Furniture - Global Design System Configuration
// This config implements the centralized design tokens for consistent styling

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      // ===========================================
      // COLOR PALETTE - Premium Furniture Brand
      // ===========================================
      colors: {
        // Primary Brand Color - Luxury Wood Tone
        primary: {
          DEFAULT: '#A86A2C',
          hover: '#8C5322',
          light: '#C48A4C',
          dark: '#7A5018',
        },
        
        // Text Colors
        text: {
          dark: '#1E1E1E',
          secondary: '#555555',
          light: '#888888',
          muted: '#AAAAAA',
        },
        
        // Background Colors
        background: {
          DEFAULT: '#FFFFFF',
          soft: '#F7F5F2',
          alt: '#F5F3F0',
          dark: '#1A1A1A',
        },
        
        // Accent Colors
        accent: {
          success: '#2E7D32',
          error: '#D32F2F',
          warning: '#F57C00',
          info: '#1976D2',
        },
        
        // Neutral Colors (grayscale)
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        
        // Border Colors
        border: {
          light: '#E5E5E5',
          DEFAULT: '#D4D4D4',
          dark: '#A3A3A3',
        },
        
        // Legacy color mappings for backward compatibility
        brand: {
          wood: "#A86A2C",
          light: "#C48A4C",
          walnut: "#5d4e37",
          oak: "#8b7355",
          amber: "#d4af37"
        },
        luxury: {
          base: "#1a1a1a",
          dark: "#0f0f0f",
          charcoal: "#2d2d2d",
          slate: "#374151",
          amber: "#d4af37",
          gold: "#b8860b",
          cream: "#f4e4bc",
          glass: "rgba(255, 255, 255, 0.1)",
          shadow: "rgba(0, 0, 0, 0.3)"
        }
      },

      // ===========================================
      // TYPOGRAPHY SYSTEM
      // ===========================================
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        geometric: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      
      // Font Sizes - Responsive Scale
      fontSize: {
        // Display - Hero text
        'display': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-sm': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        
        // Headings
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        
        // Body text
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        
        // Small text
        'small': ['0.875rem', { lineHeight: '1.5' }],
        'xs': ['0.75rem', { lineHeight: '1.5' }],
      },
      
      // Letter Spacing
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.02em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
      },

      // ===========================================
      // SPACING SYSTEM (8px Grid)
      // ===========================================
      spacing: {
        '0': '0',
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '5': '1.25rem',   // 20px
        '6': '1.5rem',    // 24px
        '7': '1.75rem',   // 28px
        '8': '2rem',      // 32px
        '10': '2.5rem',   // 40px
        '12': '3rem',     // 48px
        '14': '3.5rem',   // 56px
        '16': '4rem',     // 64px
        '20': '5rem',     // 80px
        '24': '6rem',     // 96px
        
        // Semantic spacing
        'section': '5rem',      // 80px - section padding desktop
        'section-mobile': '3rem', // 48px - section padding mobile
        'container': '2rem',   // 32px
        'card': '1.5rem',     // 24px
        'component': '1rem',   // 16px
      },

      // ===========================================
      // BORDER RADIUS SYSTEM
      // ===========================================
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',     // 4px
        'DEFAULT': '0.5rem',  // 8px
        'md': '0.625rem',    // 10px - Buttons
        'lg': '0.75rem',     // 12px
        'xl': '1rem',        // 16px - Cards
        '2xl': '1.25rem',    // 20px
        '3xl': '1.5rem',     // 24px
        'full': '9999px',
      },

      // ===========================================
      // SHADOW SYSTEM
      // ===========================================
      boxShadow: {
        'none': 'none',
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 10px rgba(0, 0, 0, 0.08)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'button': '0 4px 14px rgba(168, 106, 44, 0.25)',
        'button-hover': '0 8px 25px rgba(168, 106, 44, 0.35)',
        'card-soft': '0 10px 25px rgba(15, 23, 42, 0.06)',
      },

      // ===========================================
      // CONTAINER MAX WIDTH
      // ===========================================
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '2rem',
          xl: '2rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
        },
        maxWidth: {
          'xl': '1280px',
        },
      },

      // ===========================================
      // ANIMATIONS
      // ===========================================
      animation: {
        "fade-in": "fadeIn 1.2s ease-out",
        "slide-up": "slideUp 1s ease-out",
        "fade-in-up": "fadeInUp 1s ease-out",
        "scale-in": "scaleIn 0.8s ease-out",
        "page-fade": "pageFade 0.8s ease-in-out",
        "page-slide": "pageSlide 0.8s ease-in-out",
        "reveal-up": "revealUp 1s ease-out",
        "button-press": "buttonPress 0.2s ease-in-out",
        "cinematic-zoom": "cinematicZoom 25s ease-out forwards",
        "float": "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(50px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        pageFade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        pageSlide: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        },
        revealUp: {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        buttonPress: {
          "0%": { transform: "scale(1)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
          "50%": { transform: "scale(0.98)", boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.06)" },
          "100%": { transform: "scale(1)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }
        },
        parallaxSlow: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50px)" }
        },
        parallaxMedium: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-30px)" }
        },
        parallaxFast: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-70px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(212, 175, 55, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(212, 175, 55, 0.6)" }
        },
        luxuryFloat: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "25%": { transform: "translateY(-5px) rotate(0.5deg)" },
          "50%": { transform: "translateY(-10px) rotate(0deg)" },
          "75%": { transform: "translateY(-5px) rotate(-0.5deg)" }
        },
        elegantFade: {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        buttonLuxury: {
          "0%": { transform: "scale(1)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
          "50%": { transform: "scale(0.98)", boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.06)" },
          "100%": { transform: "scale(1)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }
        },
        imageZoom: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.05)" }
        },
        cardLift: {
          "0%": { transform: "translateY(0) scale(1)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
          "100%": { transform: "translateY(-8px) scale(1.02)", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }
        },
        cinematicZoom: {
          "0%": { transform: "scale(1) translateY(0)" },
          "100%": { transform: "scale(1.05) translateY(-10px)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
      },

      // ===========================================
      // TRANSITIONS
      // ===========================================
      transitionDuration: {
        'fast': '150ms',
        'DEFAULT': '300ms',
        'slow': '500ms',
      },
      
      transitionTimingFunction: {
        ' DEFAULT': 'ease',
        'spring': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ===========================================
      // Z-INDEX SCALE
      // ===========================================
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
    }
  },
  plugins: []
};
