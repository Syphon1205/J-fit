import { motion } from 'framer-motion';

const tickerItems = [
    '⚡️ Jake just PR’d their Deadlift',
    '🔥 Sarah finished the Lower Body Protocol',
    '🏁 Marcus closed out a 45-minute endurance block',
    '💥 Elise held tempo on every squat set',
    '🚀 Devon hit a new split pace in Run Club',
    '🌙 Kira completed Recovery Mobility at midnight',
    '🏋️‍♂️ Kai locked in a clean Bench top set',
];

export default function LiveTicker() {
    return (
        <div className="overflow-hidden rounded-full bg-white/5 px-4 py-2 backdrop-blur-md">
            <motion.div
                className="flex whitespace-nowrap gap-10 text-xs font-mono uppercase tracking-widest text-gray-400"
                animate={{ x: ['0%', '-100%'] }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            >
                {[...tickerItems, ...tickerItems].map((item, index) => (
                    <span key={`${item}-${index}`}>{item}</span>
                ))}
            </motion.div>
        </div>
    );
}
