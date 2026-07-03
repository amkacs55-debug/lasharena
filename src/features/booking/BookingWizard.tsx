import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppData } from "@/context/AppDataContext";
import { useBookingModal } from "@/context/BookingModalContext";
import { Modal } from "@/components/ui/Modal";
import { Button, Input, Label, Spinner } from "@/components/ui/primitives";
import { optimizedUrl } from "@/lib/cloudinary";
import { formatMNT, formatPrettyDate, buildSlotsForDate, nextNDays, toDateKey } from "@/lib/utils";
import { getBookedTimesForDate, createPendingBooking, confirmBookingPaid, createPayment, markPaymentPaid, setBookingStatus } from "@/lib/db";
import { createInvoice, checkInvoicePaid, markDemoInvoicePaid, qrPlaceholderDataUrl, isQpayConfigured } from "@/lib/qpay";
import type { Booking, Service } from "@/types";

type Step = "service" | "date" | "time" | "details" | "terms" | "payment" | "done";

const detailsSchema = z.object({
  name: z.string().trim().min(2, "Овог нэрээ бүтнээр нь оруулна уу"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{7}$/, "Зөв утасны дугаар (8 оронтой) оруулна уу"),
});
type DetailsForm = z.infer<typeof detailsSchema>;

const STEP_ORDER: Step[] = ["service", "date", "time", "details", "terms", "payment"];
const STEP_LABEL: Record<Step, string> = {
  service: "Үйлчилгээ",
  date: "Огноо",
  time: "Цаг",
  details: "Мэдээлэл",
  terms: "Нөхцөл",
  payment: "Төлбөр",
  done: "Дууссан",
};

export function BookingWizard() {
  const { isOpen, close, preselectedServiceId } = useBookingModal();
  const { services, settings } = useAppData();
  const activeServices = services.filter((s) => s.is_active);

  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [details, setDetails] = useState<DetailsForm | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [invoice, setInvoice] = useState<{ invoiceId: string; qrText: string; qrImage?: string } | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsForm>({ resolver: zodResolver(detailsSchema) });

  useEffect(() => {
    if (isOpen) {
      const pre = preselectedServiceId ? activeServices.find((s) => s.id === preselectedServiceId) : null;
      setService(pre ?? null);
      setStep(pre ? "date" : "service");
      setDate(null);
      setTime(null);
      setDetails(null);
      setAgreed(false);
      setBooking(null);
      setInvoice(null);
      setError("");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [isOpen, preselectedServiceId]);

  useEffect(() => {
    if (step === "time" && date) {
      setLoadingSlots(true);
      getBookedTimesForDate(date)
        .then(setBookedTimes)
        .finally(() => setLoadingSlots(false));
    }
  }, [step, date]);

  const days = useMemo(() => nextNDays(21), []);
  const slots = useMemo(() => {
    if (!date) return [];
    return buildSlotsForDate(date, settings.working_hours, settings.slot_interval_minutes, service?.duration_minutes ?? null);
  }, [date, settings, service]);
  const availableSlots = slots.filter((s) => !bookedTimes.includes(s));

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const onDetailsSubmit = (data: DetailsForm) => {
    setDetails(data);
    setStep("terms");
  };

  const startPayment = async () => {
    if (!service || !date || !time || !details) return;
    setError("");
    setPaying(true);
    try {
      const created = await createPendingBooking({
        service_id: service.id,
        service_title: service.title,
        service_price: service.price,
        date,
        time,
        customer_name: details.name,
        customer_phone: details.phone,
        advance_amount: settings.advance_amount,
      });
      setBooking(created);

      const inv = await createInvoice({
        amount: settings.advance_amount,
        description: `Advance payment - ${service.title}`,
        bookingId: created.id,
        settings,
      });
      setInvoice(inv);
      await createPayment({
        booking_id: created.id,
        amount: settings.advance_amount,
        invoice_id: inv.invoiceId,
        status: "pending",
      });
      setStep("payment");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setPaying(false);
    }
  };

  // Poll for payment confirmation once on the payment step.
  useEffect(() => {
    if (step !== "payment" || !invoice || !booking) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      const paid = await checkInvoicePaid(invoice.invoiceId);
      if (paid && !cancelled) {
        clearInterval(interval);
        await markPaymentPaid(invoice.invoiceId);
        await confirmBookingPaid(booking.id);
        setStep("done");
      }
    }, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [step, invoice, booking]);

  const handleDemoPay = () => {
    if (!invoice) return;
    markDemoInvoicePaid(invoice.invoiceId);
  };

  const handleClose = async () => {
    if (booking && booking.status === "pending_payment") {
      await setBookingStatus(booking.id, "cancelled");
    }
    close();
  };

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-8">
        <div>
          <p className="font-display text-xl font-semibold text-white">Цаг захиалах</p>
          {step !== "done" && (
            <p className="mt-0.5 text-xs text-[#B8B8B8]">
              Алхам {stepIndex + 1}/{STEP_ORDER.length} · {STEP_LABEL[step]}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/60 hover:bg-white/10"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {step !== "done" && (
        <div className="flex gap-1.5 px-6 pt-4 sm:px-8">
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? "bg-[#FF4FA0]" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      )}

      <div className="px-6 py-6 sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {step === "service" && (
              <div className="space-y-3">
                {activeServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setService(s);
                      setStep("date");
                    }}
                    className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition-all hover:border-[#FF4FA0] hover:bg-white/[0.07]"
                  >
                    <img
                      src={optimizedUrl(s.image_url, 160)}
                      alt={s.title}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-display text-base font-semibold text-white">{s.title}</p>
                      <p className="text-sm text-[#FF4FA0]">{formatMNT(s.price)}</p>
                    </div>
                    <span className="text-white/30">→</span>
                  </button>
                ))}
              </div>
            )}

            {step === "date" && (
              <div>
                <p className="mb-4 text-sm text-[#B8B8B8]">
                  Сонгосон үйлчилгээ: <span className="font-semibold text-white">{service?.title}</span>
                </p>

                <Label>Огноо сонгох</Label>
                <input
                  type="date"
                  value={date ?? ""}
                  min={toDateKey(days[0])}
                  max={toDateKey(days[days.length - 1])}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setDate(e.target.value);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white outline-none transition-colors focus:border-[#FF4FA0] [color-scheme:dark]"
                />

                <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-white/40">
                  Эсвэл ойрын өдрөөс сонгох
                </p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {days.map((d) => {
                    const key = toDateKey(d);
                    const selected = date === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setDate(key)}
                        className={`rounded-xl border px-2 py-3 text-center transition-all ${
                          selected
                            ? "border-[#FF4FA0] bg-[#FF4FA0]/15"
                            : "border-white/10 bg-white/[0.04] hover:border-[#FF4FA0]"
                        }`}
                      >
                        <p className="text-[10px] uppercase tracking-wide text-white/50">
                          {d.toLocaleDateString("mn-MN", { weekday: "short" })}
                        </p>
                        <p className="font-display text-lg font-semibold text-white">{d.getDate()}</p>
                        <p className="text-[10px] text-white/50">
                          {d.toLocaleDateString("mn-MN", { month: "short" })}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <Button className="mt-6 w-full" disabled={!date} onClick={() => setStep("time")}>
                  Үргэлжлүүлэх
                </Button>
              </div>
            )}

            {step === "time" && (
              <div>
                <p className="mb-4 text-sm text-[#B8B8B8]">
                  {service?.title} · <span className="font-semibold text-white">{date && formatPrettyDate(date)}</span>
                </p>
                {loadingSlots ? (
                  <div className="flex justify-center py-10">
                    <Spinner className="text-[#FF4FA0]" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="rounded-2xl bg-white/5 p-6 text-center text-sm text-white/60">
                    Энэ өдөр сул цаг алга байна. Өөр өдөр сонгоно уу.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {availableSlots.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTime(t);
                          setStep("details");
                        }}
                        className={`rounded-xl border px-3 py-3 text-center text-sm font-medium transition-all ${
                          time === t
                            ? "border-[#FF4FA0] bg-[#FF4FA0]/15"
                            : "border-white/10 bg-white/[0.04] hover:border-[#FF4FA0]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === "details" && (
              <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-4">
                <div>
                  <Label>Овог нэр</Label>
                  <Input placeholder="Энхжин Бат" defaultValue={details?.name} {...register("name")} />
                  {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
                </div>
                <div>
                  <Label>Утасны дугаар</Label>
                  <Input placeholder="99112233" defaultValue={details?.phone} {...register("phone")} />
                  {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
                </div>
                <Button type="submit" className="w-full">
                  Үргэлжлүүлэх
                </Button>
              </form>
            )}

            {step === "terms" && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#FF4FA0]/30 bg-[#FF4FA0]/10 p-5 text-sm leading-relaxed text-[#B8B8B8]">
                  <p className="font-semibold text-white">Урьдчилгаа төлбөрийн мэдэгдэл</p>
                  <p className="mt-2">
                    {formatMNT(settings.advance_amount)} урьдчилгаа төлбөрийг эцсийн үйлчилгээний үнээс хасаж тооцно.
                  </p>
                  <p className="mt-2">
                    Хэрэв захиалагч цагтаа ирээгүй тохиолдолд урьдчилгаа төлбөрийг буцаан олгохгүй.
                  </p>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white/[0.05] p-4">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-5 w-5 accent-[#FF4FA0]"
                  />
                  <span className="text-sm text-white">
                    Дээрх урьдчилгаа төлбөрийн нөхцлийг уншиж, зөвшөөрч байна.
                  </span>
                </label>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button className="w-full glow-pink" disabled={!agreed || paying} onClick={startPayment}>
                  {paying ? <Spinner /> : `QPay-ээр ${formatMNT(settings.advance_amount)} төлөх`}
                </Button>
              </div>
            )}

            {step === "payment" && invoice && (
              <div className="flex flex-col items-center text-center">
                <p className="text-sm text-[#B8B8B8]">Монгол банкны аппликейшнээр QR кодыг уншуулна уу</p>
                <div className="mt-5 rounded-3xl border border-white/10 bg-white p-5 shadow-lg">
                  <img
                    src={invoice.qrImage || qrPlaceholderDataUrl(invoice.qrText)}
                    alt="QPay QR code"
                    className="h-56 w-56"
                  />
                </div>
                <p className="mt-4 font-display text-2xl font-semibold text-white">
                  {formatMNT(settings.advance_amount)}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
                  <Spinner className="h-3.5 w-3.5" />
                  Төлбөр баталгаажихыг хүлээж байна…
                </div>
                {!isQpayConfigured && (
                  <Button variant="secondary" className="mt-6" onClick={handleDemoPay}>
                    Демо: Төлбөрөө төллөө
                  </Button>
                )}
              </div>
            )}

            {step === "done" && (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-3xl text-emerald-300">
                  ✓
                </div>
                <h3 className="mt-5 font-display text-2xl font-semibold text-white">Захиалга баталгаажлаа!</h3>
                <p className="mt-2 max-w-sm text-sm text-[#B8B8B8]">
                  Тантай уулзахыг тэсэн ядан хүлээж байна. {service?.title} үйлчилгээний захиалга{" "}
                  {date && formatPrettyDate(date)}, {time} цагт баталгаажлаа.
                </p>
                <div className="mt-6 w-full rounded-2xl bg-white/[0.05] p-5 text-left text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-white/50">Үйлчилгээ</span>
                    <span className="font-medium text-white">{service?.title}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-white/50">Огноо, цаг</span>
                    <span className="font-medium text-white">
                      {date && formatPrettyDate(date)} · {time}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-white/50">Төлсөн урьдчилгаа</span>
                    <span className="font-medium text-white">{formatMNT(settings.advance_amount)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-white/50">Үлдэгдэл төлбөр</span>
                    <span className="font-medium text-white">
                      {formatMNT(Math.max((service?.price ?? 0) - settings.advance_amount, 0))}
                    </span>
                  </div>
                </div>
                <Button className="mt-6 w-full" onClick={close}>
                  Дуусгах
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step !== "service" && step !== "done" && step !== "payment" && (
          <button onClick={goBack} className="mt-6 text-xs font-semibold uppercase tracking-wide text-white/40 hover:text-white/70">
            ← Буцах
          </button>
        )}
      </div>
    </Modal>
  );
}
