(function () {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const finePointer = window.matchMedia("(pointer: fine)").matches
    const desktopMotion = window.matchMedia("(min-width: 768px)").matches
    const hasGSAP = typeof window.gsap !== "undefined"
    const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined"
    const hasLenis = typeof window.Lenis !== "undefined"

    let lenis = null

    document.body.classList.add("is-loading")

    const qs = (selector, scope = document) => scope.querySelector(selector)
    const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector))

    function removeLoader() {
        const loader = qs("[data-loader]")
        if (!loader) {
            document.body.classList.remove("is-loading")
            return
        }

        if (hasGSAP && !prefersReducedMotion) {
            gsap.to(loader, {
                autoAlpha: 0,
                duration: 0.55,
                ease: "power2.out",
                onComplete: () => {
                    loader.remove()
                    document.body.classList.remove("is-loading")
                },
            })
        } else {
            loader.remove()
            document.body.classList.remove("is-loading")
        }
    }

    function initCanvas() {
        const canvas = qs("[data-ambient-canvas]")
        if (!canvas || prefersReducedMotion) return

        const context = canvas.getContext("2d")
        if (!context) return

        let width = 0
        let height = 0
        let particles = []
        let rafId = 0
        const dpr = Math.min(window.devicePixelRatio || 1, 1.6)

        function resize() {
            width = window.innerWidth
            height = window.innerHeight
            canvas.width = Math.floor(width * dpr)
            canvas.height = Math.floor(height * dpr)
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            context.setTransform(dpr, 0, 0, dpr, 0, 0)

            const count = width < 720 ? 24 : 58
            particles = Array.from({ length: count }, (_, index) => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.16,
                vy: (Math.random() - 0.5) * 0.16,
                r: index % 6 === 0 ? 1.7 : 1.1,
                alpha: 0.16 + Math.random() * 0.34,
            }))
        }

        function draw() {
            context.clearRect(0, 0, width, height)
            context.fillStyle = "rgba(54, 216, 255, 0.42)"
            context.strokeStyle = "rgba(54, 216, 255, 0.075)"
            context.lineWidth = 1

            particles.forEach((particle, index) => {
                particle.x += particle.vx
                particle.y += particle.vy

                if (particle.x < -20) particle.x = width + 20
                if (particle.x > width + 20) particle.x = -20
                if (particle.y < -20) particle.y = height + 20
                if (particle.y > height + 20) particle.y = -20

                context.globalAlpha = particle.alpha
                context.beginPath()
                context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2)
                context.fill()

                for (let j = index + 1; j < particles.length; j += 1) {
                    const other = particles[j]
                    const dx = particle.x - other.x
                    const dy = particle.y - other.y
                    const distance = Math.sqrt(dx * dx + dy * dy)
                    if (distance < 118) {
                        context.globalAlpha = (1 - distance / 118) * 0.18
                        context.beginPath()
                        context.moveTo(particle.x, particle.y)
                        context.lineTo(other.x, other.y)
                        context.stroke()
                    }
                }
            })

            context.globalAlpha = 1
            rafId = requestAnimationFrame(draw)
        }

        resize()
        draw()
        window.addEventListener("resize", resize, { passive: true })

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                cancelAnimationFrame(rafId)
            } else {
                draw()
            }
        })
    }

    function setupAnchorNavigation() {
        const links = qsa('a[href^="#"]')
        links.forEach((link) => {
            link.addEventListener("click", (event) => {
                const href = link.getAttribute("href")
                if (!href || href === "#") return
                const target = qs(href)
                if (!target) return

                event.preventDefault()
                const offset = window.innerWidth < 760 ? -96 : -128

                if (lenis && !prefersReducedMotion) {
                    lenis.scrollTo(target, { offset, duration: 1.05 })
                } else {
                    const top = target.getBoundingClientRect().top + window.scrollY + offset
                    window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" })
                }
            })
        })
    }

    function initLenis() {
        if (!hasLenis || !hasGSAP || !hasScrollTrigger || prefersReducedMotion || !desktopMotion) return

        lenis = new Lenis({
            duration: 1.05,
            smoothWheel: true,
            wheelMultiplier: 0.88,
            touchMultiplier: 1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        })

        lenis.on("scroll", ScrollTrigger.update)
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000)
        })
        gsap.ticker.lagSmoothing(0)
    }

    function splitHeroTitle() {
        const title = qs(".hero-title")
        if (!title || title.dataset.split === "true") return
        const words = title.textContent.trim().split(/\s+/)
        title.innerHTML = words.map((word) => `<span class="word">${word}</span>`).join(" ")
        title.dataset.split = "true"
    }

    function initGSAP() {
        if (!hasGSAP || prefersReducedMotion) {
            qsa(".reveal").forEach((element) => {
                element.style.opacity = "1"
                element.style.transform = "none"
                element.style.filter = "none"
            })
            removeLoader()
            return
        }

        if (hasScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger)
            initLenis()
        }

        splitHeroTitle()

        gsap.defaults({
            ease: "power3.out",
            duration: 0.78,
        })

        gsap.set(".hero .reveal", { autoAlpha: 0, y: 30, filter: "blur(10px)" })
        gsap.set(".hero-title .word", { autoAlpha: 0, y: 24, filter: "blur(8px)" })
        gsap.set(".scanner-stage", { autoAlpha: 0, y: 18, rotationY: -8, rotationX: 4, scale: 0.965 })
        gsap.set(".scan-module, .opportunity-item, .progress-panel", { autoAlpha: 0, y: 12, scale: 0.96 })
        gsap.set(".progress-track span", { scaleX: 0, transformOrigin: "left center" })
        gsap.set(".mini-bars i", { scaleY: 0.16, transformOrigin: "bottom center" })
        gsap.set(".score-progress", { strokeDashoffset: 263.89 })

        const loaderTl = gsap.timeline({
            defaults: { ease: "power3.out" },
            onComplete: removeLoader,
        })

        loaderTl
            .from(".loader-logo", { autoAlpha: 0, y: 18, scale: 0.96, duration: 0.62 })
            .fromTo(".loader-line span", { xPercent: -120 }, { xPercent: 180, duration: 0.86 }, "-=0.18")
            .from(".loader-frame p", { autoAlpha: 0, y: 8, duration: 0.36 }, "-=0.48")
            .to(".loader-frame", { scale: 0.985, autoAlpha: 0, duration: 0.38, delay: 0.08 })

        const scoreNumber = qs(".score-ring strong")
        const scoreValue = Number(qs(".score-ring")?.dataset.score || 82)
        const scoreState = { value: 0 }

        const heroTl = gsap.timeline({ delay: 1.2 })
        heroTl
            .from(".topbar", { autoAlpha: 0, y: -18, duration: 0.64 })
            .to(".hero-brand-strip, .hero .eyebrow", {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                stagger: 0.08,
                duration: 0.72,
            }, "-=0.1")
            .set(".hero-title", { autoAlpha: 1, y: 0, filter: "blur(0px)" })
            .to(".hero-title .word", {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                stagger: 0.026,
                duration: 0.68,
            }, "-=0.2")
            .to(".hero-text, .hero-actions, .signal-row", {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                stagger: 0.08,
                duration: 0.68,
            }, "-=0.25")
            .to(".scanner-wrap", {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.4,
            }, "-=0.55")
            .to(".scanner-stage", {
                autoAlpha: 1,
                y: 0,
                rotationY: 0,
                rotationX: 0,
                scale: 1,
                duration: 1.05,
                ease: "expo.out",
            }, "-=0.45")
            .from(".profile-panel, .scan-core, .action-panel", {
                autoAlpha: 0,
                y: 16,
                scale: 0.975,
                stagger: 0.08,
                duration: 0.72,
            }, "-=0.55")
            .to(scoreState, {
                value: scoreValue,
                duration: 1.15,
                ease: "power2.out",
                onUpdate: () => {
                    if (scoreNumber) scoreNumber.textContent = Math.round(scoreState.value)
                },
            }, "-=0.3")
            .to(".score-progress", {
                strokeDashoffset: 263.89 - (263.89 * scoreValue) / 100,
                duration: 1.2,
                ease: "power2.out",
            }, "<")
            .to(".scan-module", {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                stagger: 0.1,
                duration: 0.5,
            }, "-=0.65")
            .to(".progress-panel", {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.52,
            }, "-=0.42")
            .to(".progress-track span", {
                scaleX: 1,
                duration: 0.95,
                ease: "power2.out",
            }, "-=0.3")
            .to(".mini-bars i", {
                scaleY: 1,
                stagger: 0.035,
                duration: 0.62,
                ease: "power2.out",
            }, "-=0.8")
            .to(".opportunity-item", {
                autoAlpha: 1,
                x: 0,
                y: 0,
                scale: 1,
                stagger: 0.09,
                duration: 0.48,
            }, "-=0.45")

        gsap.to(".scan-beam", {
            xPercent: 470,
            repeat: -1,
            duration: 3.85,
            ease: "power3.inOut",
            delay: 2,
        })

        gsap.to(".scan-line", {
            repeat: -1,
            duration: 3.85,
            ease: "power3.inOut",
            delay: 2,
            keyframes: [
                { autoAlpha: 0, y: 0, duration: 0.01 },
                { autoAlpha: 0.95, y: 20, duration: 0.38 },
                { autoAlpha: 0.72, y: 190, duration: 2.2 },
                { autoAlpha: 0, y: 250, duration: 0.7 },
            ],
        })

        gsap.to(".center-node", {
            boxShadow: "0 0 42px rgba(54,216,255,0.32)",
            repeat: -1,
            yoyo: true,
            duration: 1.8,
            ease: "sine.inOut",
            delay: 2,
        })

        gsap.to(".orbit", {
            scale: 1.05,
            autoAlpha: 0.52,
            repeat: -1,
            yoyo: true,
            stagger: 0.3,
            duration: 2.2,
            ease: "sine.inOut",
            transformOrigin: "center center",
            delay: 1.8,
        })

        gsap.to(".scanner-stage", {
            y: -8,
            repeat: -1,
            yoyo: true,
            duration: 4.6,
            ease: "sine.inOut",
            delay: 2.1,
        })

        gsap.to(".scan-module", {
            filter: "brightness(1.18)",
            repeat: -1,
            yoyo: true,
            stagger: {
                each: 0.55,
                repeat: -1,
            },
            duration: 0.85,
            ease: "sine.inOut",
            delay: 2.25,
        })

        if (hasScrollTrigger) {
            initScrollAnimations()
            ScrollTrigger.refresh()
        }

        initScannerTilt()
    }

    function initScrollAnimations() {
        gsap.set(".section:not(.hero) .reveal", {
            autoAlpha: 0,
            y: 56,
            scale: 0.985,
            filter: "blur(10px)",
        })

        ScrollTrigger.batch(".section:not(.hero) .reveal", {
            start: "top 84%",
            once: true,
            interval: 0.08,
            batchMax: 8,
            onEnter: (batch) => {
                gsap.to(batch, {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    filter: "blur(0px)",
                    stagger: 0.075,
                    duration: 0.9,
                    ease: "power3.out",
                    overwrite: true,
                })
            },
        })

        qsa(".leak-card, .bento-card, .price-card, .checkpoint, .process-step, .mockup-browser").forEach((card) => {
            gsap.fromTo(card, {
                y: 18,
            }, {
                y: -8,
                ease: "none",
                scrollTrigger: {
                    trigger: card,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.2,
                },
            })
        })

        gsap.fromTo(".demo-dossier", {
            "--dossierGlow": 0,
        }, {
            "--dossierGlow": 1,
            scrollTrigger: {
                trigger: ".demo-dossier",
                start: "top 70%",
                end: "bottom 35%",
                scrub: 1,
            },
        })
    }

    function initHeader() {
        const topbar = qs("[data-topbar]")
        if (!topbar) return

        const onScroll = () => {
            topbar.classList.toggle("is-scrolled", window.scrollY > 24)
        }

        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
    }

    function initCardHovers() {
        const cards = qsa(".leak-card, .price-card, .bento-card, .compare-card, .checkpoint, .mockup-browser, .gallery-item, .strip-item, .contact-panel")

        cards.forEach((card) => {
            card.addEventListener("pointermove", (event) => {
                const rect = card.getBoundingClientRect()
                const x = ((event.clientX - rect.left) / rect.width) * 100
                const y = ((event.clientY - rect.top) / rect.height) * 100
                card.style.setProperty("--mx", `${x}%`)
                card.style.setProperty("--my", `${y}%`)
            })

            card.addEventListener("pointerenter", () => {
                card.classList.add("is-hovered")
                if (!hasGSAP || prefersReducedMotion) return
                gsap.to(card, { y: -6, duration: 0.28, ease: "power3.out", overwrite: true })
            })

            card.addEventListener("pointerleave", () => {
                card.classList.remove("is-hovered")
                if (!hasGSAP || prefersReducedMotion) return
                gsap.to(card, { y: 0, duration: 0.34, ease: "power3.out", overwrite: true })
            })
        })
    }

    function initScannerTilt() {
        const scanner = qs("[data-scanner]")
        if (!scanner || !finePointer || prefersReducedMotion || !hasGSAP) return

        const rotateX = gsap.quickTo(scanner, "rotationX", { duration: 0.55, ease: "power3.out" })
        const rotateY = gsap.quickTo(scanner, "rotationY", { duration: 0.55, ease: "power3.out" })

        scanner.addEventListener("mousemove", (event) => {
            const rect = scanner.getBoundingClientRect()
            const x = (event.clientX - rect.left) / rect.width - 0.5
            const y = (event.clientY - rect.top) / rect.height - 0.5
            rotateY(x * 6)
            rotateX(y * -4)
        })

        scanner.addEventListener("mouseleave", () => {
            rotateX(0)
            rotateY(0)
        })
    }

    window.addEventListener("load", () => {
        initHeader()
        setupAnchorNavigation()
        initCanvas()
        initCardHovers()
        initGSAP()

        if (!hasGSAP) {
            setTimeout(removeLoader, 450)
        }
    })
})()
