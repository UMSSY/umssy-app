import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDateTime } from "@/shared/utils/date.utils";
import { ALL_CAREERS_LABEL, SURVEY_QUESTION_TYPE_LABELS } from "../constants/survey-form.constants";
import { SURVEY_REPORT_COLORS as COLORS } from "../constants/survey-report.constants";
import type { SurveyReportDocumentProps } from "../types/survey-report.types";
import { buildMetricCards } from "../utils/build-metric-cards";
import { buildQuestionTrend } from "../utils/build-question-trend";
import { formatOptionPercentage } from "../utils/format-survey-metrics";
import { getHighlightedOptionId } from "../utils/get-highlighted-option-id";

// Sin esto la librería corta palabras en español con guiones ("in-vitados") al final de cada línea.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { padding: 32, paddingBottom: 48, fontSize: 9, fontFamily: "Helvetica", color: COLORS.ink, backgroundColor: COLORS.surface },
  eyebrow: { fontSize: 8, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginTop: 4 },
  meta: { fontSize: 9, color: COLORS.textSecondary, marginTop: 4 },
  cards: { flexDirection: "row", gap: 8, marginTop: 16 },
  card: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 10 },
  cardTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.inkSoft },
  cardValue: { fontSize: 18, fontFamily: "Helvetica-Bold", marginTop: 4 },
  cardDescription: { fontSize: 7.5, color: COLORS.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 20, marginBottom: 8 },
  question: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 12, marginBottom: 10 },
  questionHeader: { flexDirection: "row", gap: 6 },
  badge: { backgroundColor: COLORS.ink, color: COLORS.surface, fontFamily: "Helvetica-Bold", fontSize: 8, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3 },
  questionText: { flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold" },
  questionMeta: { fontSize: 7.5, color: COLORS.textSecondary, marginTop: 3, marginLeft: 26 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  label: { width: "38%", paddingRight: 6, color: COLORS.inkSoft },
  track: { width: "42%", height: 8, backgroundColor: COLORS.surfaceSoft, borderRadius: 4 },
  bar: { height: 8, borderRadius: 4 },
  value: { width: "20%", textAlign: "right" },
  trend: { marginTop: 10, padding: 8, backgroundColor: COLORS.surfaceSoft, borderRadius: 4, color: COLORS.inkSoft },
  trendLabel: { fontFamily: "Helvetica-Bold", color: COLORS.ink },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: COLORS.textSecondary },
});

// Reporte estático para el PDF (HU5): solo métricas, gráficos, conteos, porcentajes y tendencias.
export function SurveyReportDocument({ report }: SurveyReportDocumentProps) {
  const { statistics, metrics, generatedAt } = report;
  const { survey } = statistics;

  return (
    <Document title={`Reporte - ${survey.title}`} author="UMSSY" language="es">
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Reporte de analíticas de encuesta</Text>
        <Text style={styles.title}>{survey.title}</Text>
        <Text style={styles.meta}>
          {survey.period} · {survey.targetCareer ?? ALL_CAREERS_LABEL} · {statistics.questions.length} preguntas · Generado el {formatDateTime(generatedAt)}
        </Text>

        <View style={styles.cards}>
          {buildMetricCards(metrics).map((card) => (
            <View key={card.title} style={styles.card}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Resultados por pregunta</Text>
        {statistics.questions.map((question) => {
          const highlightedId = getHighlightedOptionId(question.options);
          const trend = buildQuestionTrend(question);
          const isMultiple = question.type === "MULTIPLE_CHOICE";
          return (
            <View key={question.id} style={styles.question} wrap={false}>
              <View style={styles.questionHeader}>
                <Text style={styles.badge}>P{question.order}</Text>
                <Text style={styles.questionText}>{question.text}</Text>
              </View>
              <Text style={styles.questionMeta}>
                {SURVEY_QUESTION_TYPE_LABELS[question.type]} · {question.answeredBy} titulados respondieron
                {isMultiple ? ` · porcentaje sobre ${question.totalSelections} selecciones` : ""}
              </Text>
              {question.options.map((option) => (
                <View key={option.id} style={styles.row}>
                  <Text style={styles.label}>{option.text}</Text>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.bar,
                        { width: `${option.percentage}%`, backgroundColor: option.id === highlightedId ? COLORS.danger : COLORS.primary },
                      ]}
                    />
                  </View>
                  <Text style={styles.value}>
                    {option.count} | {formatOptionPercentage(option.percentage)}
                  </Text>
                </View>
              ))}
              {trend && (
                <Text style={styles.trend}>
                  <Text style={styles.trendLabel}>Tendencia: </Text>
                  {trend}
                </Text>
              )}
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>UMSSY · Analytics Institucional</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
