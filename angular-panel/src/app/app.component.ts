import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

interface StatCard {
  title: string;
  value: string;
  trend: string;
  color: string;
}

interface ActivityItem {
  title: string;
  time: string;
  status: string;
  color: string;
}

interface ChannelItem {
  name: string;
  score: string;
  status: string;
  statusClass: "success" | "warning" | "danger";
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  stats: StatCard[] = [
    { title: "نرخ پاسخگویی", value: "۹۶٪", trend: "+۴٪ نسبت به هفته قبل", color: "#22c55e" },
    { title: "مشتریان فعال", value: "۲٬۸۴۰", trend: "+۱۸۰ ثبت نام جدید", color: "#38bdf8" },
    { title: "میانگین زمان انتظار", value: "۱:۳۲", trend: "-۱۲ ثانیه", color: "#facc15" },
    { title: "ریسک ریزش", value: "۴.۲٪", trend: "-۰.۵٪", color: "#22c55e" },
  ];

  activities: ActivityItem[] = [
    { title: "به روز رسانی پروفایل مشتری VIP", time: "۲ دقیقه پیش", status: "تکمیل شد", color: "#22c55e" },
    { title: "ارسال کمپین پیامکی شهریور", time: "۲۵ دقیقه پیش", status: "در حال اجرا", color: "#facc15" },
    { title: "ثبت تیکت تماس از مرکز مشهد", time: "۱ ساعت پیش", status: "در انتظار", color: "#38bdf8" },
    { title: "تحلیل احساسات تماس ها", time: "۳ ساعت پیش", status: "تحویل داده شد", color: "#22c55e" },
  ];

  channels: ChannelItem[] = [
    { name: "مرکز تماس", score: "۴.۷ از ۵", status: "پایدار", statusClass: "success" },
    { name: "شبکه های اجتماعی", score: "۴.۲ از ۵", status: "نیازمند توجه", statusClass: "warning" },
    { name: "پیامک هوشمند", score: "۴.۸ از ۵", status: "عالی", statusClass: "success" },
    { name: "چت وب", score: "۳.۹ از ۵", status: "ریسک", statusClass: "danger" },
  ];
}
