import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateAuctionReport = (auctionName, teams, players) => {
    console.log("Generating PDF Report for:", auctionName);
    const pdf = new jsPDF();
    const date = new Date().toLocaleDateString();

    // Title
    pdf.setFontSize(20);
    pdf.text(`${auctionName} - Auction Report`, 14, 22);
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${date}`, 14, 28);

    // Team Summary Table
    const teamColumns = ["Team Name", "Purse Used", "Remaining", "Players"];
    const teamRows = teams.map(t => [
        t.full_name,
        `Rs. ${t.spent.toLocaleString()}`,
        `Rs. ${t.remaining.toLocaleString()}`,
        t.playerCount
    ]);

    autoTable(pdf, {
        head: [teamColumns],
        body: teamRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }, // Blue header
    });

    // Players Sold Table
    const soldPlayers = players.filter(p => p.status === 'Sold');
    const playerColumns = ["Player Name", "Role", "Sold To", "Price"];
    const playerRows = soldPlayers.map(p => [
        p.name,
        p.role,
        p.Team?.name || 'Unknown',
        `Rs. ${p.sold_price?.toLocaleString() || 0}`
    ]);

    const finalY1 = pdf.lastAutoTable ? pdf.lastAutoTable.finalY : 35;
    pdf.text(`Sold Players (${soldPlayers.length})`, 14, finalY1 + 10);

    autoTable(pdf, {
        head: [playerColumns],
        body: playerRows,
        startY: finalY1 + 15,
        theme: 'striped',
        headStyles: { fillColor: [39, 174, 96] }, // Green header
    });

    // Unsold Players
    const unsoldPlayers = players.filter(p => p.status === 'Unsold');
    if (unsoldPlayers.length > 0) {
        const finalY2 = pdf.lastAutoTable ? pdf.lastAutoTable.finalY : finalY1 + 15;
        const unsoldRows = unsoldPlayers.map(p => [p.name, p.role, `Rs. ${p.base_price?.toLocaleString() || 0}`]);
        pdf.text(`Unsold Players (${unsoldPlayers.length})`, 14, finalY2 + 10);
        autoTable(pdf, {
            head: [["Player Name", "Role", "Base Price"]],
            body: unsoldRows,
            startY: finalY2 + 15,
            theme: 'striped',
            headStyles: { fillColor: [192, 57, 43] }, // Red header
        });
    }

    pdf.save(`${auctionName.replace(/ /g, '_')}_Report.pdf`);
};

export const generateMatchReport = (match, scoreData) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text(`${match.Team1.name} vs ${match.Team2.name}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`${match.match_description} | ${match.venue}`, 14, 28);
    doc.text(`Result: ${match.result_description || 'In Progress'}`, 14, 34);

    // Score Summary
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 40, 180, 20, 'F');
    doc.setFontSize(14);
    doc.text(`${scoreData.team1Score}/${scoreData.team1Wickets} (${scoreData.team1Overs})`, 20, 52);
    doc.text("vs", 95, 52);
    doc.text(`${scoreData.team2Score}/${scoreData.team2Wickets} (${scoreData.team2Overs})`, 150, 52);

    // Innings 1 Batting
    doc.setFontSize(12);
    doc.text(`${match.Team1.name} Batting`, 14, 70);

    // Using simple mock columns for now, ideally pass full scorecard data
    // Assuming scoreData has inningsDetails
    // For specific implementation, we might need to fetch full scorecard data before generating
    // Just a placeholder structure for now

    doc.save(`Match_${match.id}_Report.pdf`);
};
