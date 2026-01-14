import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Shield, Globe, ArrowRight, CheckCircle, Clock, CreditCard, Layers } from 'lucide-react';

const Landing = () => {
    return (
        <div className="bg-obsidian min-h-screen text-text-main overflow-x-hidden font-sans">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px]" />
                <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[96px]" />
            </div>

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 z-10">
                <div className="container mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-bold tracking-wide uppercase">
                            🚀 The Future of SaaS Monetization
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
                            Pay Per <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Use</span>.
                            <br />
                            Not Per <span className="text-text-muted">Month</span>.
                        </h1>
                        <p className="text-xl md:text-2xl text-text-muted max-w-3xl mx-auto mb-10 leading-relaxed">
                            Access premium AI tools, APIs, and SaaS platforms with micro-passes. 
                            <span className="text-white font-medium"> No subscriptions. No wasted credits.</span>
                        </p>
                        <div className="flex flex-col md:flex-row justify-center gap-4">
                            <Link 
                                to="/services" 
                                className="px-8 py-4 bg-white text-obsidian font-bold text-lg rounded-full hover:bg-blue-50 hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                            >
                                Explorer Marketplace <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link 
                                to="/auth" 
                                className="px-8 py-4 bg-white/5 backdrop-blur-md border border-white/20 text-lg font-bold rounded-full hover:bg-white/10 hover:border-white/40 transition-all flex items-center justify-center"
                            >
                                Start for Free
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats / Social Proof Banner */}
            <section className="bg-surface/50 border-y border-border/10 py-10 relative z-10 backdrop-blur-sm">
                <div className="container mx-auto px-4 flex flex-wrap justify-between items-center gap-8 md:gap-0">
                    {['100+ Premium APIs', 'Real-time Metering', 'Instant Refunds', 'Secure Wallets'].map((stat, i) => (
                        <div key={i} className="flex items-center gap-3 text-text-muted font-medium">
                            <CheckCircle className="text-blue-500" size={20} /> {stat}
                        </div>
                    ))}
                </div>
            </section>

            {/* Problem vs Solution Section */}
            <section className="py-24 px-4 relative z-10">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Pay for Idle Time?</h2>
                        <p className="text-text-muted text-lg">The traditional subscription model is broken.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Old Way */}
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            className="p-8 rounded-2xl border border-red-500/20 bg-red-500/5"
                        >
                            <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-3">
                                <Clock /> The Old Way
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-4 text-text-muted">
                                    <span className="text-red-500 text-xl">✕</span> Monthly recurring charges even if you don't use it.
                                </li>
                                <li className="flex items-start gap-4 text-text-muted">
                                    <span className="text-red-500 text-xl">✕</span> Impossible to cancel forgotten subscriptions.
                                </li>
                                <li className="flex items-start gap-4 text-text-muted">
                                    <span className="text-red-500 text-xl">✕</span> High entry barrier for trying new tools.
                                </li>
                            </ul>
                        </motion.div>

                        {/* FlexPass Way */}
                        <motion.div 
                             initial={{ x: 20, opacity: 0 }}
                             whileInView={{ x: 0, opacity: 1 }}
                             viewport={{ once: true }}
                             className="p-8 rounded-2xl border border-green-500/20 bg-green-500/5 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 bg-green-500 text-obsidian font-bold text-xs rounded-bl-xl uppercase tracking-wider">Recommended</div>
                            <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-3">
                                <Zap /> The FlexPass Way
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-4 text-text-muted">
                                    <span className="text-green-500 text-xl">✓</span> Buy a 24-hour pass or 50 API calls.
                                </li>
                                <li className="flex items-start gap-4 text-text-muted">
                                    <span className="text-green-500 text-xl">✓</span> Auto-expiry ensures no future charges.
                                </li>
                                <li className="flex items-start gap-4 text-text-muted">
                                    <span className="text-green-500 text-xl">✓</span> Try expensive enterprise tools for ₹50.
                                </li>
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-surface/30 relative z-10">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16">Start in 3 Steps</h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { icon: CreditCard, title: "1. Top Up", desc: "Add funds to your secure universal wallet." },
                            { icon: Layers, title: "2. Choose Pass", desc: "Select a Time-Pass or Usage-Pass for any tool." },
                            { icon: Zap, title: "3. Instant Access", desc: "Get API keys or Access Tokens instantly." }
                        ].map((step, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ y: 30, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                                className="text-center group"
                            >
                                <div className="w-20 h-20 mx-auto bg-surface border border-border rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300 shadow-xl">
                                    <step.icon className="w-10 h-10 text-text-muted group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                                <p className="text-text-muted leading-relaxed">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-4 relative z-10">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="glass-card p-12 md:p-16 border-t-4 border-t-blue-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
                        
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to stop overpaying?</h2>
                        <p className="text-xl text-text-muted mb-10 max-w-2xl mx-auto">
                            Join thousands of developers and creators who are saving 70% on their monthly SaaS bills.
                        </p>
                        <Link 
                            to="/auth"
                            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl px-10 py-5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1"
                        >
                            Create Free Account <ArrowRight />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-text-muted border-t border-border bg-obsidian relative z-10">
                <div className="container mx-auto px-4">
                     <div className="flex justify-center gap-8 mb-8">
                         <a href="#" className="hover:text-blue-400 transition-colors">Twitter</a>
                         <a href="#" className="hover:text-blue-400 transition-colors">GitHub</a>
                         <a href="#" className="hover:text-blue-400 transition-colors">Discord</a>
                     </div>
                    <p>&copy; 2026 FlexPass Inc. Built for Hackathon Demo.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
