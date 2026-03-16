

## Plano: Cadastrar 15 novos pacientes e criar 18 agendamentos para 17/03/2026

### Pacientes já existentes (apenas criar agendamento)
1. LUIZ GUSTAVO ALVES CASTRO (id: c09d6acd)
2. MIGUEL MARTINS DE SOUZA (id: 95dfb1eb)
3. ANNA LUIZA GOMES DE OLIVEIRA (id: 741215f8)

### 15 Novos pacientes a cadastrar (unidade: atendimento_floresta)
**Agenda Psiquiatria (Dr. Lucas Bifano - 9d447125):**
1. MIGUEL MENEZES SOARES - M, 20/07/2015, tel: (11) 98608-8315, mãe: Rosa Maria Menezes Soares
2. JOAO GUILHERME ESTEVES DE SOUZA - M, 02/09/2020, tel: (31) 99244-6804, mãe: Viviane Esteves Vieira de Souza
3. THAYLLA VITORIA CASTRO SILVA - F, 29/03/2016, tel: (31) 98587-3920, mãe: Aediani Ramos da Silva
4. EVELIN CAROLINE RODRIGUES SILVA - F, 10/06/2019, tel: (31) 99660-0777, mãe: Natalia Cardoso da Silva

**Agenda Fonoaudiologia (Fernanda Moreira - 2ab273a1):**
5. GABRIEL HENRIQUE LINHARES NERES - M, 25/04/2016, tel: (31) 97529-0572, mãe: Mylenna Linhares Gomes
6. RAFAEL RODRIGUES SILVA - M, 24/06/2017, tel: (31) 98427-3999, mãe: Dayane Ferreira Rodrigues Silva
7. ENZO HENRIQUE VIEIRA AZEVEDO - M, 26/04/2017, tel: (31) 97509-3261, mãe: Kamile de Azevedo Soares
8. EMMANUELE VITÓRIA FRANCA DE ANDRADE - F, 04/06/2018, tel: (31) 98116-2947, mãe: Carine Santos de Andrade
9. MIGUEL ANGELO FERNANDES SILVA PEREIRA - M, 17/09/2016, tel: (31) 3455-9676, mãe: Ana Paula Andrade Silva Pereira

**Agenda Neurologia (Dra. Mariana Horst - 9c2787f5):**
10. RAFAEL THIEL DE MATOS - M, 17/09/2021, tel: (31) 99734-7230, mãe: Karyne Elizabeth Thiel
11. GABRIEL VINICIUS ALVES DA SILVA - M, 25/12/2020, tel: (31) 98766-2791, mãe: Alessandra Alves Primo
12. RAEL MOREIRA LEAL - M, 14/04/2020, mãe: Leticia de Souza Moreira
13. MIGUEL MOREIRA LEAL - M, 14/04/2020, mãe: Leticia de Souza Moreira
14. MÁRCIO ANTÔNIO MESQUITA ROSA - M, 09/09/2021, tel: (31) 98282-4509, mãe: Ludimila de Mesquita Pereira
15. MATHEUS LUCAS GOMES DA SILVA - M, 03/03/2018, tel: (31) 99928-4937, mãe: Luana Gomes Dias

### 18 Agendamentos para 17/03/2026
Cada agendamento com duração de 40 min, status "scheduled", unidade "atendimento_floresta":

| Hora | Paciente | Profissional | Tipo |
|---|---|---|---|
| 08:00 | MIGUEL MENEZES SOARES | Lucas Bifano | Consulta Psiquiatria |
| 08:00 | RAFAEL THIEL DE MATOS | Mariana Horst | Consulta Neurologia |
| 08:30 | ANNA LUIZA GOMES DE OLIVEIRA | Fernanda Moreira | Fonoaudiologia |
| 08:40 | LUIZ GUSTAVO ALVES CASTRO | Lucas Bifano | Consulta Psiquiatria |
| 08:40 | GABRIEL VINICIUS ALVES DA SILVA | Mariana Horst | Consulta Neurologia |
| 09:00 | MIGUEL MARTINS DE SOUZA | Fernanda Moreira | Fonoaudiologia |
| 09:20 | JOAO GUILHERME ESTEVES DE SOUZA | Lucas Bifano | Consulta Psiquiatria |
| 09:20 | RAEL MOREIRA LEAL | Mariana Horst | Consulta Neurologia |
| 09:30 | GABRIEL HENRIQUE LINHARES NERES | Fernanda Moreira | Fonoaudiologia |
| 10:00 | THAYLLA VITORIA CASTRO SILVA | Lucas Bifano | Consulta Psiquiatria |
| 10:00 | MIGUEL MOREIRA LEAL | Mariana Horst | Consulta Neurologia |
| 10:00 | RAFAEL RODRIGUES SILVA | Fernanda Moreira | Fonoaudiologia |
| 10:40 | MÁRCIO ANTÔNIO MESQUITA ROSA | Mariana Horst | Consulta Neurologia |
| 11:20 | EVELIN CAROLINE RODRIGUES SILVA | Lucas Bifano | Consulta Psiquiatria |
| 11:20 | MATHEUS LUCAS GOMES DA SILVA | Mariana Horst | Consulta Neurologia |
| 13:30 | ENZO HENRIQUE VIEIRA AZEVEDO | Fernanda Moreira | Fonoaudiologia |
| 14:00 | EMMANUELE VITÓRIA FRANCA DE ANDRADE | Fernanda Moreira | Fonoaudiologia |
| 14:30 | MIGUEL ANGELO FERNANDES SILVA PEREIRA | Fernanda Moreira | Fonoaudiologia |

### Implementação
1. Inserir 15 pacientes na tabela `clients` com nome, telefone (da mãe), nascimento, gênero, responsável, unidade
2. Criar 18 registros na tabela `schedules` vinculando cada paciente ao profissional correto
3. Os vínculos (client_assignments) serão criados automaticamente pelo trigger `auto_assign_client_on_schedule`

### Nota
- Não há código a ser alterado, apenas inserções de dados via SQL
- Os pacientes GABRIEL LUCAS DE JESUS e ANTÔNIO HENRIQUE não tiveram dados detalhados nos PDFs

