import { motion } from "motion/react";
import { useAppData } from "@/context/AppDataContext";
import { SectionHeading, Card, Button } from "@/components/ui/primitives";
import { optimizedUrl } from "@/lib/cloudinary";
import { dayLabel } from "@/lib/utils";

export function ContactSection() {
  const { settings } = useAppData();

  return (
    <section id="contact" className="section-pad bg-[#0F0F0F]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="Бидэнд зочилно уу" title="Манай студийг олох" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full overflow-hidden">
              <div className="aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10]">
                <img
                  src={optimizedUrl(settings.address_image_url, 900)}
                  alt="Salon location"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <Card className="p-8 sm:p-10">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#FF4FA0]">Хаяг</p>
                  <p className="mt-2 font-display text-lg text-white">{settings.address}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#FF4FA0]">Утас</p>
                  <a href={`tel:${settings.phone}`} className="mt-2 block font-display text-lg text-white transition-colors hover:text-[#FF4FA0]">
                    {settings.phone}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#FF4FA0]">Ажиллах цаг</p>
                  <ul className="mt-2 space-y-1 text-sm text-[#B8B8B8]">
                    {settings.working_hours.map((wh) => (
                      <li key={wh.day} className="flex justify-between gap-6">
                        <span>{dayLabel(wh.day)}</span>
                        <span>{wh.closed ? "Амарна" : `${wh.open} – ${wh.close}`}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a href={settings.facebook_url} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="md">
                      Facebook
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
