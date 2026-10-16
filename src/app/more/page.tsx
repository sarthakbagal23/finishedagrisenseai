"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Cloud, FileText, Landmark, Settings, ChevronRight, Calendar, Phone, BookOpen, UserCircle, Crown, Plane, LayoutGrid, Microscope } from 'lucide-react';
import Link from 'next/link';
import { useSensors } from '@/context/SensorContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } } },
} as const;

export default function MoreHub() {
  const { t } = useSensors();

  const services = [
    { title: 'Research Lab', desc: 'Drought & root-response simulator', icon: Microscope, href: '/research', iconColor: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { title: t('more_subscription'), desc: t('more_sub_subscription'), icon: Crown, href: '/subscription', iconColor: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { title: t('settings_title'), desc: t('more_sub_settings'), icon: Settings, href: '/settings', iconColor: 'text-muted-foreground', bg: 'bg-muted/30 border-border/50' },
    { title: t('more_weather'), desc: t('more_sub_weather'), icon: Cloud, href: '/weather', iconColor: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { title: t('more_doctor'), desc: t('more_sub_doctor'), icon: ShieldCheck, href: '/diagnosis', iconColor: 'text-sage', bg: 'bg-sage/10 border-sage/20' },
    { title: t('more_drone'), desc: t('more_sub_drone'), icon: Plane, href: '/services', iconColor: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    { title: t('more_education'), desc: t('more_sub_education'), icon: BookOpen, href: '/education', iconColor: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { title: t('more_journal'), desc: t('more_sub_journal'), icon: FileText, href: '/journal', iconColor: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
    { title: t('more_schemes'), desc: t('more_sub_schemes'), icon: Landmark, href: '/schemes', iconColor: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  const subResources = [
    { label: t('res_market'), sub: t('res_view'), icon: Calendar, href: 'https://www.enam.gov.in/web/' },
    { label: t('res_experts'), sub: t('res_call'), icon: Phone, href: 'tel:18001801551' },
    { label: t('res_manual'), sub: t('res_read'), icon: BookOpen, href: 'https://agrisenseainindia.netlify.app' },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={stagger.container}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={stagger.item} className="flex items-center gap-3 px-1">
        <div className="bg-muted/50 border border-border/50 p-2.5 rounded-xl">
          <LayoutGrid className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground">{t('more_title')}</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{t('more_utility_desc')}</p>
        </div>
      </motion.div>

      {/* Service Links */}
      <div className="grid gap-2.5">
        {services.map((service, i) => (
          <motion.div key={i} variants={stagger.item} whileHover={{ y: -1, transition: { duration: 0.15 } }}>
            <Link href={service.href}>
              <Card className="border border-border/50 bg-card/80 hover:border-primary/20 transition-colors rounded-xl overflow-hidden group">
                <CardContent className="p-3.5 flex items-center gap-4">
                  <div className={cn("p-2.5 rounded-lg border", service.bg)}>
                    <service.icon className={cn("w-5 h-5", service.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{service.title}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate mt-0.5">{service.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Resources */}
      <motion.div variants={stagger.item}>
        <Card className="border border-border/50 bg-card/80 rounded-2xl overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-xl">
                <LayoutGrid className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{t('more_resources')}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{t('more_essential_tools')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {subResources.map((r, idx) => (
                <a key={idx} href={r.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 transition-colors group">
                  <r.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase leading-tight text-foreground truncate w-full">{r.label}</p>
                    <p className="text-[9px] font-medium text-muted-foreground uppercase mt-0.5">{r.sub}</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Meet the Team */}
      <motion.div variants={stagger.item}>
        <Card className="border border-primary/20 bg-gradient-to-br from-primary/12 to-sage/8 rounded-2xl overflow-hidden shadow-premium">
          <CardContent className="p-6 space-y-5">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">{t('more_meet_team')}</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">{t('meet_team_desc')}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: t('role_ceo_name' as any), role: t('role_ceo'), icon: UserCircle },
                { name: t('role_cto_name' as any), role: t('role_cto'), icon: UserCircle },
                { name: t('role_cfo_name' as any), role: t('role_cfo'), icon: UserCircle },
              ].map((member, i) => (
                <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/20 border border-border/30">
                  <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg mb-2">
                    <member.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-[9px] font-bold uppercase leading-tight mb-1 truncate w-full text-foreground">{member.name}</p>
                  <Badge variant="outline" className="text-[8px] font-bold tracking-wider uppercase px-2 h-4 border-primary/25 text-primary bg-primary/10">{member.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}