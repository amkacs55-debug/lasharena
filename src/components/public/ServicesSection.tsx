import { motion } from "motion/react";
import { useAppData } from "@/context/AppDataContext";
import { useBookingModal } from "@/context/BookingModalContext";
import { Card, SectionHeading, Button, Badge, EmptyState } from "@/components/ui/primitives";
import { optimizedUrl } from "@/lib/cloudinary";
import { formatDuration, formatMNT } from "@/lib/utils";

export function ServicesSection() {
  const { services, loading } = useAppData();
  const { open } = useBookingModal();
  const active = services.filter((s) => s.is_active);

  return (
    <section id="services" className="section-pad bg-[#0F0F0F]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Үйлчилгээний цэс"
          title="Онцгой хөмсөг сунгалтын үйлчилгээ"
          subtitle="Мэргэшсэн хөмсөгчид маань чанартай, хөнгөн материал ашиглан үйлчилгээ бүрийг тусгайлан хийж гүйцэтгэдэг."
        />

        {!loading && active.length === 0 && (
          <EmptyState
            title="Үйлчилгээ тун удахгүй"
            subtitle="Студийн баг маань цэсийг шинэчилж байна. Түр хүлээгээд дахин орж үзнэ үү."
          />
        )}

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {active.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
            >
              <Card hover className="flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={optimizedUrl(service.image_url, 600)}
                    alt={service.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-110"
                  />
                  {service.duration_minutes && (
                    <Badge tone="neutral" className="absolute right-3 top-3 bg-black/60 text-white backdrop-blur-sm">
                      {formatDuration(service.duration_minutes)}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-semibold text-white">{service.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#B8B8B8]">{service.description}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-display text-lg font-semibold text-[#FF4FA0]">
                      {formatMNT(service.price)}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => open(service.id)}>
                      Захиалах
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
