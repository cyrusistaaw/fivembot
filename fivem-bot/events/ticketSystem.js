const {
    ChannelType,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    AttachmentBuilder
} = require('discord.js');

const { get: getSetting } = require('../lib/settings');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.guild) return;
        if (!interaction.isButton()) return;

        if (interaction.customId === 'create_ticket' || interaction.customId === 'ticket_ac') {
            const existing = interaction.guild.channels.cache.find(
                c => c.name === `ticket-${interaction.user.username.toLowerCase()}`
            );

            if (existing) {
                return interaction.reply({ content: '❌ Zaten açık bir ticketın var!', ephemeral: true });
            }

            try {
                const kategoriId = getSetting('TICKET_KATEGORI_ID');
                const yetkiliRolId = getSetting('TICKET_YETKILI_ROL');
                const logChannelId = getSetting('TICKET_LOG');

                const channel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    parent: kategoriId,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        {
                            id: interaction.user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ],
                        },
                        ...(yetkiliRolId ? [{
                            id: yetkiliRolId,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ],
                        }] : [])
                    ],
                });

                const embed = new EmbedBuilder()
                    .setColor('#00b0f4')
                    .setTitle('🎫 Yeni Destek Talebi')
                    .setDescription(`👤 Kullanıcı: <@${interaction.user.id}>\n🆔 ID: ${interaction.user.id}\n\nYetkililer en kısa sürede ilgilenecek.`)
                    .setFooter({ text: 'Eternal Family Ticket Sistemi' })
                    .setTimestamp();

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Ticket Kapat')
                        .setStyle(ButtonStyle.Danger)
                );

                await channel.send({
                    content: yetkiliRolId ? `<@&${yetkiliRolId}> | ${interaction.user}` : `${interaction.user}`,
                    embeds: [embed],
                    components: [closeRow]
                });

                await interaction.reply({ content: `✅ Ticket açıldı: ${channel}`, ephemeral: true });

                const logChannel = logChannelId ? await interaction.client.channels.fetch(logChannelId).catch(() => null) : null;
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('🎫 Ticket Açıldı')
                        .addFields(
                            { name: 'Kullanıcı', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Kanal', value: `${channel.name}`, inline: true }
                        )
                        .setTimestamp();
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            } catch (error) {
                console.error('Ticket Hatası:', error);
                if (!interaction.replied) {
                    await interaction.reply({ content: '❌ Ticket oluşturulamadı. Kategori/izinleri kontrol et.', ephemeral: true });
                }
            }

            return;
        }

        if (interaction.customId === 'close_ticket') {
            try {
                const logChannelId = getSetting('TICKET_LOG');
                const logChannel = logChannelId ? await interaction.client.channels.fetch(logChannelId).catch(() => null) : null;

                if (logChannel) {
                    const msgs = await interaction.channel.messages.fetch({ limit: 100 }).catch(() => null);
                    if (msgs) {
                        const sorted = [...msgs.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
                        const lines = sorted.map(m => {
                            const ts = new Date(m.createdTimestamp).toISOString();
                            const author = m.author?.tag || 'Bilinmiyor';
                            const content = (m.content || '').replace(/\n/g, ' ');
                            return `[${ts}] ${author}: ${content}`;
                        }).join('\n');

                        const file = new AttachmentBuilder(
                            Buffer.from(lines || 'Transcript boş.', 'utf8'),
                            { name: `ticket-${interaction.channel.id}.txt` }
                        );
                        logChannel.send({ content: `📄 Transcript: #${interaction.channel.name}`, files: [file] }).catch(() => {});
                    }

                    const closeLogEmbed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('🔒 Ticket Kapatıldı')
                        .addFields(
                            { name: 'Kapatan', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Kanal', value: `${interaction.channel.name}`, inline: true }
                        )
                        .setTimestamp();
                    logChannel.send({ embeds: [closeLogEmbed] }).catch(() => {});
                }

                await interaction.reply({ content: 'Ticket 2 saniye içinde kapatılıyor...' });
                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 2000);
            } catch (error) {
                console.error('Kapatma Hatası:', error);
            }
        }
    }
};
